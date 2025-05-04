import chunkArray from '~/utils/chunkArray';
import { db } from '~/server/db';
import { hatcheryTable, recordingsTable } from '~/database/schema';
import { inArray, sql } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { dragCaveFetch } from '~/server/utils/dragCaveFetch';
import { isIncubated, isStunned } from '~/utils/calculations';
import type { DragonData } from '~/types/DragonTypes';
import { blockedApiQueue } from './queue';

export async function cleanUp() {
  const { clientSecret } = useRuntimeConfig();

  const start = new Date().getTime();

  const hatcheryDragons = await db
    .select({
      id: hatcheryTable.id,
      userId: hatcheryTable.userId,
      inSeedTray: hatcheryTable.inSeedTray,
      inGarden: hatcheryTable.inGarden,
      isIncubated: hatcheryTable.isIncubated,
      isStunned: hatcheryTable.isStunned,
    })
    .from(hatcheryTable);

  type DragonCode = (typeof hatcheryDragons)[number]['id'];

  const removeFromSeedTray = new Set<DragonCode>();
  const removeFromHatchery = new Set<DragonCode>();
  const updateIncubated = new Set<DragonCode>();
  const updateStunned = new Set<DragonCode>();
  const apiBlockedTest = new Set<(typeof hatcheryDragons)[number]['userId']>();
  let hatchlings = 0;
  let eggs = 0;
  let adults = 0;
  let dead = 0;
  let male = 0;
  let female = 0;
  let ungendered = 0;
  let caveborn = 0;
  let lineaged = 0;

  const chunkedDragons = chunkArray(hatcheryDragons, 400);

  const promises = await Promise.allSettled(
    chunkedDragons.map(async (chunk) => {
      const apiResponse = await dragCaveFetch()<{
        errors: unknown[];
        dragons: Record<string, DragonData>;
      }>(`/dragons`, {
        method: 'POST',
        timeout: 20000,
        retry: 3,
        retryDelay: 1000 * 5,
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          ids: chunk.map((dragon) => dragon.id).join(','),
        }),
      });

      for (const hatcheryDragon of chunk) {
        const { id: code } = hatcheryDragon;

        // If it didn't come back in the response, we can assume they blocked the Garden.
        // Sucks for them. We'll remove it, and add a note to the user.
        if (code in apiResponse.dragons === false) {
          removeFromHatchery.add(code);
          apiBlockedTest.add(hatcheryDragon.userId);
          continue;
        }

        const apiDragon = apiResponse.dragons[code];

        if (hatcheryDragon.inSeedTray && apiDragon.hoursleft > 96) {
          hatcheryDragon.inSeedTray = false;
          removeFromSeedTray.add(code);
        }

        if (
          apiDragon.hoursleft < 0 ||
          (!hatcheryDragon.inSeedTray && !hatcheryDragon.inGarden)
        ) {
          removeFromHatchery.add(code);
        }

        if (apiDragon.grow !== '0') {
          adults++;
        } else if (apiDragon.death === '0' && apiDragon.hatch !== '0') {
          hatchlings++;
        } else if (apiDragon.death === '0') {
          eggs++;
        } else if (apiDragon.death !== '0') {
          dead++;
        }

        // not hidden, frozen, adult or dead.
        if (apiDragon.hoursleft > -1) {
          if (apiDragon.parent_f || apiDragon.parent_m) {
            lineaged++;
          } else {
            caveborn++;
          }

          // filter to only record hatchlings
          if (apiDragon.grow === '0' && apiDragon.hatch !== '0') {
            if (apiDragon.gender === 'Female') {
              female++;
            } else if (apiDragon.gender === 'Male') {
              male++;
            } else {
              ungendered++;
            }
          }
        }

        if (
          hatcheryDragon.isIncubated === false &&
          !removeFromHatchery.has(code) &&
          isIncubated(apiDragon)
        ) {
          updateIncubated.add(code);
        }

        if (
          hatcheryDragon.isStunned === false &&
          !removeFromHatchery.has(code) &&
          isStunned(apiDragon)
        ) {
          updateStunned.add(code);
        }
      }
    })
  );

  const removeFromHatcheryStatement = db
    .delete(hatcheryTable)
    .where(inArray(hatcheryTable.id, sql.placeholder('chunk')))
    .prepare();

  const removeFromSeedTrayStatement = db
    .update(hatcheryTable)
    .set({ inSeedTray: false })
    .where(inArray(hatcheryTable.id, sql.placeholder('chunk')))
    .prepare();

  const updateIncubatedStatement = db
    .update(hatcheryTable)
    .set({ isIncubated: true })
    .where(inArray(hatcheryTable.id, sql.placeholder('chunk')))
    .prepare();

  const updateStunnedStatement = db
    .update(hatcheryTable)
    .set({ isStunned: true })
    .where(inArray(hatcheryTable.id, sql.placeholder('chunk')))
    .prepare();

  let successfullyRemoved = 0;

  await Promise.allSettled([
    ...chunkArray([...removeFromSeedTray], 200).map(async (chunk) =>
      removeFromSeedTrayStatement.execute({ chunk })
    ),
    ...chunkArray([...removeFromHatchery], 200).map(async (chunk) => {
      const [{ affectedRows }] = await removeFromHatcheryStatement.execute({
        chunk,
      });
      successfullyRemoved += affectedRows;
    }),
    ...chunkArray([...updateIncubated], 200).map(async (chunk) =>
      updateIncubatedStatement.execute({ chunk })
    ),
    ...chunkArray([...updateStunned], 200).map(async (chunk) =>
      updateStunnedStatement.execute({ chunk })
    ),
  ]);

  // We can't totally be sure that just because we couldn't find one of their dragons
  // that they're blocking us. For example, maybe they transferred it to an account
  // that does have the Garden blocked. To be thorough, we'll find something
  // on their scroll and check against that.
  for (const userId of apiBlockedTest) {
    console.log('Adding to blockedApiQueue', userId);
    await blockedApiQueue.add(
      'blockedApiQueue',
      {
        userId,
      },
      {
        removeOnComplete: {
          age: 1000 * 60 * 60 * 24 * 7,
        },
        removeOnFail: {
          age: 1000 * 60 * 60 * 24 * 14,
        },
      }
    );
  }

  const end = new Date().getTime();

  const failures = promises.filter((p) => p.status === 'rejected').length;

  await db.insert(recordingsTable).values([
    {
      recordedOn: DateTime.now()
        .startOf('minute')
        .toSQL({ includeOffset: false }),
      value: successfullyRemoved,
      recordType: 'clean_up',
      extra: {
        chunks: promises.length,
        success: promises.length - failures,
        failures,
        duration: end - start,
        eggs,
        hatchlings,
        adults,
        dead,
        hatchlingsMale: male,
        hatchlingsFemale: female,
        hatchlingsUngendered: ungendered,
        caveborn,
        lineaged,
      },
    },
  ]);

  await useStorage('cache').removeItem(
    'statistics:hatcheryTotals:cleanUp.json'
  );
}
