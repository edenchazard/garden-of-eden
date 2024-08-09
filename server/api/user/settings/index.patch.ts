import pool from "~/server/pool";
import type { RowDataPacket } from "mysql2";
import { getToken } from "#auth";
import userSettingsSchema from "~/utils/userSettingsSchema";

export default defineEventHandler(async (event) => {
  const [token, body] = await Promise.all([
    getToken({ event }),
    readBody<UserSettings>(event),
  ]);

  const settings = userSettingsSchema.parse(body);

  // delete
  await pool.execute<RowDataPacket[]>(
    `UPDATE user_settings SET
    frequency = ?,
    perPage = ?,
    sort = ?,
    hatchlingMinAge = ?,
    eggMinAge = ?,
    showScrollRatio = ?
    WHERE user_id = ?`,
    [
      settings.frequency ?? null,
      body.perPage ?? null,
      body.sort ?? null,
      body.hatchlingMinAge ?? null,
      body.eggMinAge ?? null,
      body.showScrollRatio ?? null,
      token?.userId,
    ]
  );

  return sendNoContent(event);
});
