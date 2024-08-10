import pool from '~/server/pool';
import type { RowDataPacket } from 'mysql2';
import { getToken } from '#auth';
import { z } from 'zod';

export default defineEventHandler(async (event) => {
  const [token, body] = await Promise.all([
    getToken({ event }),
    readBody<string[]>(event),
  ]);

  const codesIn = z.string().array().parse(body);
  const con = await pool.getConnection();
  await con.beginTransaction();
  await con.execute<RowDataPacket[]>(
    con.format(
      `DELETE FROM hatchery WHERE user_id = ?` +
        (codesIn.length ? ` AND code NOT IN (?)` : ''),
      [token?.userId, codesIn]
    )
  );

  // insert only if dragons were selected
  if (codesIn.length > 0) {
    await con.execute<RowDataPacket[]>(
      con.format(
        `INSERT INTO hatchery (code, user_id) VALUES ? ON DUPLICATE KEY UPDATE user_id = ?`,
        [codesIn.map((id: string) => [id, token?.userId]), token?.userId]
      )
    );
  }

  await con.commit();
  con.release();

  return body;
});
