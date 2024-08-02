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
  const bulkDelete = con.format(
    `DELETE FROM hatchery WHERE user_id = ? AND code NOT IN (?)`,
    [token?.userId, body]
  );
  await con.execute<RowDataPacket[]>(bulkDelete);

  // insert only if dragons were selected
  if (body.length > 0) {
    const bulkInsert = con.format(
      `INSERT INTO hatchery (code, user_id) VALUES ? ON DUPLICATE KEY UPDATE id=id`,
      [body.map((id: string) => [id, token?.userId])]
    );

    await con.execute<RowDataPacket[]>(bulkInsert);
  }

  await con.commit();
  con.release();

  return body;
});
