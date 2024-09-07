import { getToken } from '#auth';
import type { RowDataPacket } from 'mysql2';
import pool from '~/server/pool';

export default defineEventHandler(async (event) => {
  const token = await getToken({ event });

  const response = await $fetch<{
    errors: Array<[number, string]>;
    dragons: Record<string, DragonData>;
  }>(
    `https://dragcave.net/api/v2/user?username=${token?.username}&filter=GROWING`,
    {
      timeout: 10000,
      headers: {
        Authorization: `Bearer ${token?.sessionToken}`,
      },
    }
  );

  console.log(response);

  if (response.errors.length && response.errors.find(([code]) => code === 4)) {
    return [];
  }

  const scroll = Object.values(response.dragons);
  const alive = scroll.filter((dragon) => dragon.hoursleft >= 0);

  // resync dragcave scroll and hatchery for the user
  const con = await pool.getConnection();

  try {
    if (alive.length) {
      await con.beginTransaction();
      // if a dragon that was in the hatchery has been moved to this scroll,
      // we should update its user id to reflect the change of ownership
      await con.execute<RowDataPacket[]>(
        con.format(`UPDATE hatchery SET user_id = ? WHERE code IN (?)`, [
          token?.userId,
          alive.map((dragon) => dragon.id),
        ])
      );
      await con.execute<RowDataPacket[]>(
        con.format(
          `DELETE FROM hatchery WHERE user_id = ? AND code NOT IN (?)`,
          [token?.userId, alive.map((dragon) => dragon.id)]
        )
      );
      await con.commit();
    }

    const [usersDragonsInHatchery] = await con.execute<RowDataPacket[]>(
      `SELECT code, in_garden, in_seed_tray FROM hatchery WHERE user_id = ?`,
      [token?.userId]
    );

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
  } catch (e) {
    await con.rollback();
    throw e;
  } finally {
    con.release();
  }
});
