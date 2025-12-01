import {
  clicksLeaderboardsTable,
  clicksTable,
  itemsTable,
  usersSettingsTable,
  usersTable,
} from '~/database/schema';
import type { JWT } from 'next-auth/jwt';
import { getToken } from '#auth';
import { and, between, eq, lte, or, sql } from 'drizzle-orm';
import { db } from '~/server/db';
import { z } from 'zod';
import { DateTime, Interval } from 'luxon';

const clicksTotalForWeekCached = defineCachedFunction(
  async (start: DateTime) => {
    const [{ clicksThisWeek: clicks }] = await db
      .select({
        clicksThisWeek:
          sql<string>`0 + SUM(${clicksLeaderboardsTable.clicksGiven})`.as(
            'clicks_this_week'
          ),
      })
      .from(clicksLeaderboardsTable)
      .where(
        and(
          eq(clicksLeaderboardsTable.leaderboard, 'weekly'),
          eq(clicksLeaderboardsTable.start, start.toJSDate())
        )
      );
    return Number(clicks ?? 0);
  },
  {
    maxAge: 60 * 10,
    group: 'statistics',
    name: 'clickTotals',
    getKey: (start: DateTime) => `week-${start.toISO()}`,
  }
);

const dailyTotalsForWeekCached = defineCachedFunction(
  async (start: DateTime) => {
    const data = await db
      .select({
        date: sql<string>`DATE(${clicksTable.clickedOn})`.as('date'),
        clicksGiven: sql<string>`COUNT(*)`.as('clicks_given'),
      })
      .from(clicksTable)
      .where(
        between(
          clicksTable.clickedOn,
          start.toJSDate(),
          start.endOf('week').toJSDate()
        )
      )
      .groupBy(sql`date`);

    return Object.fromEntries(
      Interval.fromDateTimes(start, start.endOf('week'))
        .splitBy({
          days: 1,
        })
        .map((date: Interval) => [
          date.start?.toISODate(),
          data.find((d) => d.date === date.start?.toISODate())?.clicksGiven ??
            0,
        ])
    ) as Record<string, number>;
  },
  {
    maxAge: 60 * 10,
    group: 'statistics',
    name: 'clickTotals',
    getKey: (start: DateTime) => `week-${start.toISO()}-daily-totals`,
  }
);

export default defineEventHandler(async (event) => {
  const token = (await getToken({ event })) as JWT;
  const schema = z.object({
    start: z.string().default(DateTime.now().startOf('week').toISO()),
  });

  const query = await getValidatedQuery(event, schema.parse);

  const weekStart = DateTime.fromISO(query.start);

  const [clicksGiven, dailyTotals, results] = await Promise.all([
    clicksTotalForWeekCached(weekStart),
    dailyTotalsForWeekCached(weekStart),
    db
      .select({
        rank: clicksLeaderboardsTable.rank,
        username: sql<string>`
      CASE
        WHEN (${clicksLeaderboardsTable.userId} = ${token?.userId ?? null} AND ${usersSettingsTable.anonymiseStatistics} = 1) THEN -1
        WHEN ${usersSettingsTable.anonymiseStatistics} = 1 THEN -2
        ELSE ${usersTable.username}
      END`.as('username'),
        clicksGiven: clicksLeaderboardsTable.clicksGiven,
        flair: {
          url: itemsTable.url,
          name: itemsTable.name,
          description: itemsTable.description,
          artist: itemsTable.artist,
          releaseDate: itemsTable.releaseDate,
        },
      })
      .from(clicksLeaderboardsTable)
      .innerJoin(usersTable, eq(usersTable.id, clicksLeaderboardsTable.userId))
      .innerJoin(
        usersSettingsTable,
        eq(usersSettingsTable.userId, clicksLeaderboardsTable.userId)
      )
      .leftJoin(itemsTable, eq(usersSettingsTable.flairId, itemsTable.id))
      .where(
        and(
          eq(clicksLeaderboardsTable.leaderboard, 'weekly'),
          eq(clicksLeaderboardsTable.start, weekStart.toJSDate()),
          or(
            eq(clicksLeaderboardsTable.userId, token?.userId),
            lte(clicksLeaderboardsTable.rank, 10)
          )
        )
      )
      .orderBy(clicksLeaderboardsTable.rank)
      .limit(11),
  ]);

  return {
    results,
    clicksGiven,
    dailyTotals,
    weekStart: weekStart.toISO() as string,
    weekEnd: weekStart.plus({ days: 7 }).toISO() as string,
  };
});
