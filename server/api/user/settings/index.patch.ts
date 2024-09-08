import pool from '~/server/pool';
import { getToken } from '#auth';
import userSettingsSchema from '~/utils/userSettingsSchema';

export default defineEventHandler(async (event) => {
  const [token, settings] = await Promise.all([
    getToken({ event }),
    readValidatedBody(event, userSettingsSchema.parse),
  ]);

  await pool.execute(
    `UPDATE user_settings SET
    gardenFrequency = ?,
    gardenPerPage = ?,
    seedTrayFrequency = ?,
    seedTrayPerPage = ?,
    sort = ?,
    hatchlingMinAge = ?,
    eggMinAge = ?,
    showScrollRatio = ?,
    autoSeedTray = ?
    WHERE user_id = ?`,
    [
      settings.gardenFrequency,
      settings.gardenPerPage,
      settings.seedTrayFrequency,
      settings.seedTrayPerPage,
      settings.sort,
      settings.hatchlingMinAge,
      settings.eggMinAge,
      settings.showScrollRatio,
      settings.autoSeedTray,
      token?.userId,
    ]
  );

  return sendNoContent(event);
});
