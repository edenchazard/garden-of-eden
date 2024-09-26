import { db } from '~/server/db';
import { getToken } from '#auth';
import userSettingsSchema from '~/utils/userSettingsSchema';
import { userSettings } from '~/database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const [token, settings] = await Promise.all([
    getToken({ event }),
    readValidatedBody(event, userSettingsSchema.parse),
  ]);

  await db
    .update(userSettings)
    .set(settings)
    .where(eq(userSettings.user_id, token?.userId));

  return sendNoContent(event);
});
