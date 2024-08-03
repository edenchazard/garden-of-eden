import pool from "~/server/pool";
import type { RowDataPacket } from "mysql2";
import { getToken } from "#auth";
import { z } from "zod";

export default defineEventHandler(async (event) => {
  const [token, body] = await Promise.all([
    getToken({ event }),
    readBody<Partial<UserSettings>>(event),
  ]);

  const settings = z
    .object({
      frequency: z.coerce.string().optional(),
      perPage: z.coerce.number().optional(),
      sort: z.coerce.string().optional(),
    })
    .parse(body);

  // delete
  await pool.execute<RowDataPacket[]>(
    `UPDATE user_settings SET frequency = ?, perPage = ?, sort = ? WHERE user_id = ?`,
    [
      settings.frequency ?? null,
      body.perPage ?? null,
      body.sort ?? null,
      token?.userId,
    ]
  );

  return sendNoContent(event);
});
