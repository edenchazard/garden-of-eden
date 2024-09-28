import { and, eq, gt, sql } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';
import { clicksTable } from '~/database/schema';
import { db } from '~/server/db';
import { getToken } from '#auth';

export default defineEventHandler(async (event) => {
  const token = (await getToken({ event })) as JWT;

  const startOfToday = new Date();
  startOfToday.setDate(startOfToday.getDate() - 1);

  const [personalStats] = await db
    .select({ clicked_24: sql<number>`COUNT(*)`.as('clicked_24') })
    .from(clicksTable)
    .where(
      and(
        eq(clicksTable.user_id, token.userId),
        gt(clicksTable.clicked_on, startOfToday)
      )
    );

  return personalStats;
});
