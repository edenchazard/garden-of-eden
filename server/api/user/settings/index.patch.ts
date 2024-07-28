import pool from "~/server/pool";
import type { RowDataPacket } from "mysql2";
import { getToken } from "#auth";

export default defineEventHandler(async (event) => {
  const [token, body] = await Promise.all([
    getToken({ event }),
    readBody<Partial<UserSettings>>(event),
  ]);

  // delete
  await pool.execute<RowDataPacket[]>(
    `UPDATE user_settings SET frequency = ?, perPage = ?, sort = ? WHERE user_id = ?`,
    [
      body.frequency ?? null,
      body.perPage ?? null,
      body.sort ?? null,
      token?.userId,
    ]
  );

  return sendNoContent(event);
});
