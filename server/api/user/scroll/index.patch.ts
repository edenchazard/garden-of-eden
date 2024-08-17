import pool from '~/server/pool';
import type { RowDataPacket } from 'mysql2';
import { getToken } from '#auth';
import { z } from 'zod';

export default defineEventHandler(async (event) => {
  const [token, body] = await Promise.all([
    getToken({ event }),
    readBody(event),
  ]);

  const dragons = z
    .array(
      z.object({
        id: z.string().length(5),
        in_garden: z.boolean().default(false),
        in_seed_tray: z.boolean().default(false),
      })
    )
    .parse(body);

  const con = await pool.getConnection();

  try {
    await con.beginTransaction();
    await con.execute(
      con.format(`DELETE FROM hatchery WHERE user_id = ? OR code IN (?)`, [
        token?.userId,
        dragons.map((dragon) => dragon.id) ?? [null],
      ])
    );

    const add = dragons.filter(
      (dragon) => dragon.in_garden || dragon.in_seed_tray
    );

    if (add.length > 0) {
      await con.execute<RowDataPacket[]>(
        con.format(
          `
      INSERT INTO hatchery (code, user_id, in_garden, in_seed_tray) VALUES ? ON DUPLICATE KEY UPDATE user_id = ?`,
          [
            add.map((dragon) => [
              dragon.id,
              token?.userId,
              dragon.in_garden,
              dragon.in_seed_tray,
            ]),
            token?.userId,
          ]
        )
      );
    }

    await con.commit();
    return add.map((dragon) => dragon.id);
  } catch (e) {
    await con.rollback();
    throw e;
  } finally {
    con.release();
  }
});
