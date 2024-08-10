import pool from '~/server/pool';
import type { RowDataPacket } from 'mysql2';
import { getToken } from '#auth';
import userSettingsSchema from '~/utils/userSettingsSchema';

export default defineEventHandler(async (event) => {
  const [token, body] = await Promise.all([
    getToken({ event }),
    readBody(event),
  ]);

  const settings = userSettingsSchema.parse(body);

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
      settings.frequency,
      settings.perPage,
      settings.sort,
      settings.hatchlingMinAge,
      settings.eggMinAge,
      settings.showScrollRatio,
      token?.userId,
    ]
  );

  return sendNoContent(event);
});
