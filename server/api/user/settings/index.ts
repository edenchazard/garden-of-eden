import { getToken } from '#auth';
import { eq, getTableColumns } from 'drizzle-orm';
import { userSettings } from '~/database/schema';
import { db } from '~/server/db';

export default defineEventHandler(async (event) => {
  const token = await getToken({ event });

  const { user_id, ...settings } = getTableColumns(userSettings);

  return await db
    .select(settings)
    .from(userSettings)
    .where(eq(userSettings.user_id, token?.userId))
    .execute();
});
