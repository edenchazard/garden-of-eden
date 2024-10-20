import {
  clicksLeaderboardTable,
  itemsTable,
  userSettingsTable,
  userTable,
} from '~/database/schema';
import type { JWT } from 'next-auth/jwt';
import { getToken } from '#auth';
import { and, eq, lte, or, sql } from 'drizzle-orm';
import { db } from '~/server/db';
import { z } from 'zod';
import { DateTime } from 'luxon';

const clicksTotalForWeekCached = defineCachedFunction(
  async (start: DateTime) => {
    const data = await db
      .select({
        clicks_this_week:
          sql<string>`SUM(${clicksLeaderboardTable.clicks_given})`.as(
            'clicks_this_week'
          ),
      })
      .from(clicksLeaderboardTable)
      .where(
        and(
          eq(clicksLeaderboardTable.leaderboard, 'weekly'),
          eq(clicksLeaderboardTable.start, start.toJSDate())
        )
      );

    return data;
  },
  {
    maxAge: 60 * 10,
    group: 'statistics',
    name: 'clickTotals',
    getKey: (start: DateTime) => `week-${start.toISO()}`,
  }
);

export default defineEventHandler(async (event) => {
  const token = (await getToken({ event })) as JWT;
  const schema = z.object({
    start: z.string().default(DateTime.now().startOf('week').toISO()),
  });

  const query = await getValidatedQuery(event, schema.parse);

  const weekStart = DateTime.fromISO(query.start);

  const [[{ clicks_this_week: clicksGiven }], results] = await Promise.all([
    clicksTotalForWeekCached(weekStart),
    db
      .select({
        rank: clicksLeaderboardTable.rank,
        username: sql<string>`
      CASE
        WHEN (${clicksLeaderboardTable.user_id} = ${token?.userId ?? null} AND ${userSettingsTable.anonymiseStatistics} = 1) THEN -1
        WHEN ${userSettingsTable.anonymiseStatistics} = 1 THEN -2
        ELSE ${userTable.username}
      END`.as('username'),
        clicks_given: clicksLeaderboardTable.clicks_given,
        flair: {
          url: itemsTable.url,
          name: itemsTable.name,
        },
      })
      .from(clicksLeaderboardTable)
      .innerJoin(userTable, eq(userTable.id, clicksLeaderboardTable.user_id))
      .innerJoin(
        userSettingsTable,
        eq(userSettingsTable.user_id, clicksLeaderboardTable.user_id)
      )
      .leftJoin(itemsTable, eq(userSettingsTable.flair_id, itemsTable.id))
      .where(
        and(
          eq(clicksLeaderboardTable.leaderboard, 'weekly'),
          eq(clicksLeaderboardTable.start, weekStart.toJSDate()),
          or(
            eq(clicksLeaderboardTable.user_id, token?.userId),
            lte(clicksLeaderboardTable.rank, 10)
          )
        )
      )
      .orderBy(clicksLeaderboardTable.rank)
      .limit(11),
  ]);

  return {
    results,
    clicksGiven: parseInt(clicksGiven),
    weekStart: weekStart.toISO() as string,
    weekEnd: weekStart.plus({ days: 7 }).toISO() as string,
  };
});
