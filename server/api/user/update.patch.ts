import pool from "~/server/pool";
import type { RowDataPacket } from "mysql2";
import { getToken } from "#auth";

export default defineEventHandler(async (event) => {
  const token = await getToken({ event });

  // delete
  await pool.execute<RowDataPacket[]>(
    `DELETE FROM hatchery WHERE username = ?`,
    [token?.username]
  );

  const body = await readBody(event);

  // insert only if dragons were selected
  if (body.length > 0) {
    const bulkInsert = pool.format(
      `INSERT INTO hatchery (code, username) VALUES ?`,
      [body.map((id: string) => [id, token?.username])]
    );

    await pool.execute<RowDataPacket[]>(bulkInsert);
  }

  return body;
});
