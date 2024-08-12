import type { RowDataPacket } from 'mysql2';
import pool from '~/server/pool';
import chunkArray from '~/utils/chunkArray';

export async function cleanUp() {
  const { clientSecret } = useRuntimeConfig();

  const start = new Date().getTime();

  const con = await pool.getConnection();

  const [codes] = await con.execute<RowDataPacket[]>(
    `SELECT code FROM hatchery`
  );

  const chunkedDragons = chunkArray(codes, 400);
  const apiResponse = await Promise.all(
    chunkedDragons.map((chunk) =>
      $fetch<{
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
      })
    )
  );

  const removeFromSeedTray = apiResponse
    .flatMap((response) => Object.values(response.dragons))
    .filter((dragon) => dragon.hoursleft >= 96)
    .map((dragon) => dragon.id);

  const toDelete = apiResponse
    .flatMap((response) => Object.values(response.dragons))
    .filter((dragon) => dragon.hoursleft < 0)
    .map((dragon) => dragon.id);

  await con.beginTransaction();

  if (toDelete.length) {
    await con.execute(
      con.format(`DELETE FROM hatchery WHERE code IN (?)`, [toDelete])
    );
  }

  if (removeFromSeedTray.length) {
    await con.execute(
      con.format(`UPDATE hatchery SET in_seed_tray = 0 WHERE code IN (?)`, [
        removeFromSeedTray,
      ])
    );
  }

  const end = new Date().getTime();

  await con.execute(
    `INSERT INTO recordings (value, record_type, extra) VALUES (?, ?, ?)`,
    [toDelete.length, 'removed', JSON.stringify({ start, end })]
  );

  await con.commit();
  con.release();
}
