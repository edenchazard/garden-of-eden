import chunkArray from '~/utils/chunkArray';
import { db } from '~/server/db';
import { hatcheryTable, recordingsTable, userTable } from '~/database/schema';
import { inArray } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { dragCaveFetch } from '~/server/utils/dragCaveFetch';
import { isIncubated, isStunned } from '~/utils/calculations';
import type { DragonData } from '~/types/DragonTypes';

export async function cleanUp() {
  const { clientSecret } = useRuntimeConfig();

  const start = new Date().getTime();

  const hatcheryDragons = await db
    .select({
      id: hatcheryTable.id,
      userId: hatcheryTable.user_id,
      in_seed_tray: hatcheryTable.in_seed_tray,
      in_garden: hatcheryTable.in_garden,
      is_incubated: hatcheryTable.is_incubated,
      is_stunned: hatcheryTable.is_stunned,
    })
    .from(hatcheryTable);

  const removeFromSeedTray: string[] = [];
  const removeFromHatchery: string[] = [];
  const updateIncubated: string[] = [];
  const updateStunned: string[] = [];
  const apiBlocked: Set<number> = new Set();
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
          removeFromHatchery.push(code);
          apiBlocked.add(hatcheryDragon.userId);
          continue;
        }

        const apiDragon = apiResponse.dragons[code];

        if (hatcheryDragon.in_seed_tray && apiDragon.hoursleft > 96) {
          hatcheryDragon.in_seed_tray = false;
          removeFromSeedTray.push(code);
        }

        if (
          apiDragon.hoursleft < 0 ||
          (!hatcheryDragon.in_seed_tray && !hatcheryDragon.in_garden)
        ) {
          removeFromHatchery.push(code);
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
          hatcheryDragon.is_incubated === false &&
          !removeFromHatchery.includes(code) &&
          isIncubated(apiDragon)
        ) {
          updateIncubated.push(code);
        }

        if (
          hatcheryDragon.is_stunned === false &&
          !removeFromHatchery.includes(code) &&
          isStunned(apiDragon)
        ) {
          updateStunned.push(code);
        }
      }
    })
  );

  await Promise.allSettled(
    chunkArray(removeFromSeedTray, 200).map(async (chunk) =>
      db
        .update(hatcheryTable)
        .set({ in_seed_tray: false })
        .where(inArray(hatcheryTable.id, chunk))
    )
  );

  let successfullyRemoved = 0;

  await Promise.allSettled(
    chunkArray(removeFromHatchery, 200).map(async (chunk) => {
      const [{ affectedRows }] = await db
        .delete(hatcheryTable)
        .where(inArray(hatcheryTable.id, chunk));
      successfullyRemoved += affectedRows;
    })
  );

  await Promise.allSettled(
    chunkArray(updateIncubated, 200).map(async (chunk) =>
      db
        .update(hatcheryTable)
        .set({ is_incubated: true })
        .where(inArray(hatcheryTable.id, chunk))
    )
  );

  await Promise.allSettled(
    chunkArray(updateStunned, 200).map(async (chunk) =>
      db
        .update(hatcheryTable)
        .set({ is_stunned: true })
        .where(inArray(hatcheryTable.id, chunk))
    )
  );

  await Promise.allSettled(
    chunkArray(Array.from(apiBlocked), 200).map(async (chunk) =>
      db
        .update(userTable)
        .set({ apiBlocked: true })
        .where(inArray(userTable.id, chunk))
    )
  );

  const end = new Date().getTime();

  const failures = promises.filter((p) => p.status === 'rejected').length;

  await db.insert(recordingsTable).values([
    {
      recorded_on: DateTime.now()
        .startOf('minute')
        .toSQL({ includeOffset: false }),
      value: successfullyRemoved,
      record_type: 'clean_up',
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
