import pool from "~/server/pool";
import type { RowDataPacket } from "mysql2";
import { getToken } from "#auth";

export default defineEventHandler(async (event) => {
  const [token, body] = await Promise.all([
    getToken({ event }),
    readBody<string[]>(event),
  ]);

  const con = await pool.getConnection();
  await con.beginTransaction();

  await con.execute<RowDataPacket[]>(`DELETE FROM hatchery WHERE user_id = ?`, [
    token?.userId,
  ]);

  // insert only if dragons were selected
  if (body.length > 0) {
    const bulkInsert = con.format(
      `INSERT INTO hatchery (code, user_id) VALUES ?`,
      [body.map((id: string) => [id, token?.userId])]
    );

    await con.execute<RowDataPacket[]>(bulkInsert);
  }

  await con.commit();
  con.release();

  return body;
});
