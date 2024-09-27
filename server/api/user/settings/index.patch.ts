import { db } from '~/server/db';
import { getToken } from '#auth';
import { userSettingsTable, userSettingsSchema } from '~/database/schema';
import { eq } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';

export default defineEventHandler(async (event) => {
  const [token, settings] = await Promise.all([
    getToken({ event }) as Promise<JWT>,
    readValidatedBody(event, userSettingsSchema.parse),
  ]);

  await db
    .update(userSettingsTable)
    .set(settings)
    .where(eq(userSettingsTable.user_id, token.userId));

  return sendNoContent(event);
});
