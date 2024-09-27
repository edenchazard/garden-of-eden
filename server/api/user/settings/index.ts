import { getToken } from '#auth';
import { eq, getTableColumns } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';
import { userSettings } from '~/database/schema';
import { db } from '~/server/db';

export default defineEventHandler(async (event) => {
  const token = (await getToken({ event })) as JWT;

  const { user_id, ...settings } = getTableColumns(userSettings);

  return await db
    .select(settings)
    .from(userSettings)
    .where(eq(userSettings.user_id, token.userId));
});
