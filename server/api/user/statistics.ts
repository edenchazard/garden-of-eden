import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';
import { clicksTable, hatcheryTable } from '~/database/schema';
import { db } from '~/server/db';
import { getToken } from '#auth';

export default defineEventHandler(async (event) => {
  const token = (await getToken({ event })) as JWT;

  const startOfToday = new Date();
  startOfToday.setDate(startOfToday.getDate() - 1);

  const personalStats = (
    await Promise.all([
      db
        .select({ clicked_24: sql<number>`COUNT(*)`.as('clicked_24') })
        .from(clicksTable)
        .where(
          and(
            eq(clicksTable.user_id, token.userId),
            gt(clicksTable.clicked_on, startOfToday)
          )
        ),
      db
        .select({ not_clicked: sql<number>`COUNT(*)`.as('not_clicked') })
        .from(hatcheryTable)
        .leftJoin(
          clicksTable,
          and(
            eq(hatcheryTable.id, clicksTable.hatchery_id),
            eq(clicksTable.user_id, token.userId)
          )
        )
        .where(isNull(clicksTable.user_id)),
    ])
  )
    .flat()
    .reduce<{ clicked_24: number; not_clicked: number }>(
      (acc, val) => ({ ...acc, ...val }),
      {
        clicked_24: 0,
        not_clicked: 0,
      }
    );

  return personalStats;
});
