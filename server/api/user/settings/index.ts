import { getToken } from '#auth';
import { eq, getTableColumns } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';
import { usersSettingsTable } from '~~/database/schema';
import { db } from '~~/server/db';

export default defineEventHandler(async (event) => {
  const token = (await getToken({ event })) as JWT;

  const { userId, ...settings } = getTableColumns(usersSettingsTable);

  return await db
    .select(settings)
    .from(usersSettingsTable)
    .where(eq(usersSettingsTable.userId, token.userId));
});
