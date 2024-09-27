import { db } from '~/server/db';
import { getToken } from '#auth';
import { userSettings, userSettingsSchema } from '~/database/schema';
import { eq } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';

export default defineEventHandler(async (event) => {
  const [token, settings] = await Promise.all([
    getToken({ event }) as Promise<JWT>,
    readValidatedBody(event, userSettingsSchema.parse),
  ]);

  await db
    .update(userSettings)
    .set(settings)
    .where(eq(userSettings.user_id, token.userId));

  return sendNoContent(event);
});
