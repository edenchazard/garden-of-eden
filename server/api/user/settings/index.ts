import { getToken } from "#auth";
import { RowDataPacket } from "mysql2";
import pool from "~/server/pool";

export default defineEventHandler(async (event) => {
  const token = await getToken({ event });

  const [[{ user_id, ...values }]] = await pool.execute<RowDataPacket[]>(
    `SELECT * FROM user_settings WHERE user_id = ?`,
    [token?.userId]
  );

  return values as UserSettings;
});
