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

  const [usersDragonsInHatchery] = await pool.execute<RowDataPacket[]>(
    `SELECT code FROM hatchery WHERE username = ?`,
    [token?.username]
  );

  const existingCodes = usersDragonsInHatchery.map((row) => row.code);

  const dragonsWithData =
    Object.entries(response.dragons).map<ScrollView>(([id, data]) => ({
      ...data,
      inHatchery: existingCodes.includes(id),
    })) ?? [];

  return dragonsWithData;
});
