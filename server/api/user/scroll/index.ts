import { getToken } from "#auth";
import { RowDataPacket } from "mysql2";
import pool from "~/server/pool";

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

  if (toDelete.length) {
    await pool.execute<RowDataPacket[]>(
      `DELETE FROM hatchery WHERE user_id = ? AND code NOT IN (` +
        toDelete.map((id) => `'${id}'`).join(",") +
        `)`,
      [token?.userId]
    );
  }

  const [usersDragonsInHatchery] = await pool.execute<RowDataPacket[]>(
    `SELECT code FROM hatchery WHERE user_id = ?`,
    [token?.userId]
  );

  const existingCodes = usersDragonsInHatchery.map((row) => row.code);

  const dragonsWithData = filteredScroll.map<ScrollView>((dragon) => ({
    ...dragon,
    inHatchery: existingCodes.includes(dragon.id),
  }));

  return dragonsWithData;
});
