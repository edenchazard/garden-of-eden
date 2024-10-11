import chunkArray from '~/utils/chunkArray';
import { db } from '~/server/db';
import { hatcheryTable, recordingsTable } from '~/database/schema';
import { inArray } from 'drizzle-orm';

export async function cleanUp() {
  const { clientSecret } = useRuntimeConfig();

  const start = new Date().getTime();

  const hatcheryDragons = await db
    .select({
      id: hatcheryTable.id,
      in_seed_tray: hatcheryTable.in_seed_tray,
      in_garden: hatcheryTable.in_garden,
    })
    .from(hatcheryTable);

  const removeFromSeedTray: string[] = [];
  const removeFromHatchery: string[] = [];
  const chunkedDragons = chunkArray(hatcheryDragons, 400);

  await Promise.allSettled(
    chunkedDragons.map(async (chunk) => {
      const apiResponse = await $fetch<{
        errors: unknown[];
        dragons: Record<string, DragonData>;
      }>(`https://dragcave.net/api/v2/dragons`, {
        method: 'POST',
        timeout: 20000,
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          ids: chunk.map((dragon) => dragon.id).join(','),
        }),
      });

      for (const code in apiResponse.dragons) {
        const dragon = apiResponse.dragons[code];
        const hatcheryStatus = hatcheryDragons.find((d) => d.id === dragon.id);

        if (hatcheryStatus?.in_seed_tray && dragon.hoursleft > 96) {
          hatcheryStatus.in_seed_tray = false;
          removeFromSeedTray.push(code);
        }

        if (
          dragon.hoursleft < 0 ||
          (!hatcheryStatus?.in_seed_tray && !hatcheryStatus?.in_garden)
        ) {
          removeFromHatchery.push(code);
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

  const end = new Date().getTime();

  await db.insert(recordingsTable).values({
    value: successfullyRemoved,
    record_type: 'removed',
    extra: { duration: end - start },
  });
}
