import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '~/server/pool';
import chunkArray from '~/utils/chunkArray';

export async function cleanUp() {
  const { clientSecret } = useRuntimeConfig();

  const start = new Date().getTime();

  const con = await pool.getConnection();

  const [hatcheryDragons] = await con.execute<RowDataPacket[]>(
    `SELECT code, in_seed_tray, in_garden FROM hatchery`
  );

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
        timeout: 10000,
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          ids: chunk.map((dragon) => dragon.code).join(','),
        }),
      });

      for (const code in apiResponse.dragons) {
        const dragon = apiResponse.dragons[code];
        const hatcheryStatus = hatcheryDragons.find(
          (d) => d.code === dragon.id
        );

        if (hatcheryStatus?.in_seed_tray === 1 && dragon.hoursleft > 96) {
          hatcheryStatus.in_seed_tray = 0;
          removeFromSeedTray.push(code);
        }

        if (
          dragon.hoursleft < 0 ||
          (hatcheryStatus?.in_seed_tray === 0 &&
            hatcheryStatus?.in_garden === 0)
        ) {
          removeFromHatchery.push(code);
        }
      }
    })
  );

  await Promise.allSettled(
    chunkArray(removeFromSeedTray, 200).map(async (chunk) =>
      con.execute(
        con.format(`UPDATE hatchery SET in_seed_tray = 0 WHERE code IN (?)`, [
          chunk,
        ])
      )
    )
  );

  let successfullyRemoved = 0;

  await Promise.allSettled(
    chunkArray(removeFromHatchery, 200).map(async (chunk) => {
      const [deleted] = await con.execute<ResultSetHeader>(
        con.format(`DELETE FROM hatchery WHERE code IN (?)`, [chunk])
      );

      successfullyRemoved += deleted.affectedRows;
    })
  );

  const end = new Date().getTime();

  await con.execute(
    `INSERT INTO recordings (value, record_type, extra) VALUES (?, ?, ?)`,
    [successfullyRemoved, 'removed', JSON.stringify({ duration: end - start })]
  );

  con.release();
}
