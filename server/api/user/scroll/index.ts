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

  const filteredScroll = Object.values(response.dragons).filter(
    (dragon) => dragon.hoursleft >= 0
  );

  // resync dragcave scroll and hatchery for the user
  const toDelete = filteredScroll.map((dragon) => dragon.id);

  const con = await pool.getConnection();
  await con.beginTransaction();

  if (toDelete.length) {
    // if a dragon that was in the hatchery has been moved to this scroll,
    // we should update its user id to reflect the change of ownership
    await con.execute<RowDataPacket[]>(
      con.format(`UPDATE hatchery SET user_id = ? WHERE code IN (?)`, [
        token?.userId,
        toDelete,
      ])
    );

    await con.execute<RowDataPacket[]>(
      con.format(`DELETE FROM hatchery WHERE user_id = ? AND code NOT IN (?)`, [
        token?.userId,
        toDelete,
      ])
    );
  }

  const [usersDragonsInHatchery] = await con.execute<RowDataPacket[]>(
    `SELECT code FROM hatchery WHERE user_id = ?`,
    [token?.userId]
  );

  con.commit();
  con.release();

  const existingCodes = usersDragonsInHatchery.map((row) => row.code);

  const dragonsWithData = filteredScroll.map<ScrollView>((dragon) => ({
    ...dragon,
    inHatchery: existingCodes.includes(dragon.id),
  }));

  return dragonsWithData;
});
