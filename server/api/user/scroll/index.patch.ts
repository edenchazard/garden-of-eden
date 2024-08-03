import pool from "~/server/pool";
import type { RowDataPacket } from "mysql2";
import { getToken } from "#auth";
import { z } from "zod";

export default defineEventHandler(async (event) => {
  const [token, body] = await Promise.all([
    getToken({ event }),
    readBody<string[]>(event),
  ]);

  const codesIn = z.string().array().parse(body);
  const con = await pool.getConnection();
  await con.beginTransaction();
  const bulkDelete = con.format(
    `DELETE FROM hatchery WHERE user_id = ?` +
      (codesIn.length ? ` AND code NOT IN (?)` : ""),
    [token?.userId, codesIn]
  );
  await con.execute<RowDataPacket[]>(bulkDelete);

  // insert only if dragons were selected
  if (codesIn.length > 0) {
    const bulkInsert = con.format(
      `INSERT INTO hatchery (code, user_id) VALUES ? ON DUPLICATE KEY UPDATE code=code`,
      [codesIn.map((id: string) => [id, token?.userId])]
    );

    await con.execute<RowDataPacket[]>(bulkInsert);
  }

  await con.commit();
  con.release();

  return body;
});
