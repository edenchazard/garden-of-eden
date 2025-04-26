import { db } from '~/server/db';
import { getToken } from '#auth';
import { usersSettingsTable, userSettingsSchema } from '~/database/schema';
import { eq } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';

export default defineEventHandler(async (event) => {
  const [token, settings] = await Promise.all([
    getToken({ event }) as Promise<JWT>,
    readValidatedBody(event, userSettingsSchema.parse),
  ]);

  await db
    .update(usersSettingsTable)
    .set(settings)
    .where(eq(usersSettingsTable.userId, token.userId));

  return sendNoContent(event);
});
