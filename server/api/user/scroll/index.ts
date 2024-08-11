import { getToken } from '#auth';
import type { RowDataPacket } from 'mysql2';
import pool from '~/server/pool';

export default defineEventHandler(async (event) => {
  const token = await getToken({ event });

  const response = await $fetch<{
    errors: unknown[];
    dragons: Record<string, DragonData>;
  }>(
    `https://dragcave.net/api/v2/user?username=${token?.username}&filter=GROWING`,
    {
      headers: {
        Authorization: `Bearer ${token?.sessionToken}`,
      },
    }
  );

  const scroll = Object.values(response.dragons);
  const alive = scroll.filter((dragon) => dragon.hoursleft >= 0);

  // resync dragcave scroll and hatchery for the user
  const con = await pool.getConnection();
  await con.beginTransaction();

  if (alive.length) {
    // if a dragon that was in the hatchery has been moved to this scroll,
    // we should update its user id to reflect the change of ownership
    await con.execute<RowDataPacket[]>(
      con.format(`UPDATE hatchery SET user_id = ? WHERE code IN (?)`, [
        token?.userId,
        alive.map((dragon) => dragon.id),
      ])
    );

    await con.execute<RowDataPacket[]>(
      con.format(`DELETE FROM hatchery WHERE user_id = ? AND code NOT IN (?)`, [
        token?.userId,
        alive.map((dragon) => dragon.id),
      ])
    );
  }

  const [usersDragonsInHatchery] = await con.execute<RowDataPacket[]>(
    `SELECT code, in_garden, in_seed_tray FROM hatchery WHERE user_id = ?`,
    [token?.userId]
  );

  await con.commit();
  con.release();

  return alive.map<ScrollView>((dragon) => {
    const hatcheryDragon = usersDragonsInHatchery.find(
      (row) => row.code === dragon.id
    );

    return {
      ...dragon,
      in_garden: !!(hatcheryDragon?.in_garden ?? false),
      in_seed_tray: !!(hatcheryDragon?.in_seed_tray ?? false),
    };
  });
});
