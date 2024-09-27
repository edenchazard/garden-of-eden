import { getToken } from '#auth';
import { eq, getTableColumns } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';
import { userSettingsTable } from '~/database/schema';
import { db } from '~/server/db';

export default defineEventHandler(async (event) => {
  const token = (await getToken({ event })) as JWT;

  const { user_id, ...settings } = getTableColumns(userSettingsTable);

  return await db
    .select(settings)
    .from(userSettingsTable)
    .where(eq(userSettingsTable.user_id, token.userId));
});
