import { and, desc, eq, gte, lte, or, sql } from 'drizzle-orm';
import { DateTime } from 'luxon';
import type { JWT } from 'next-auth/jwt';
import { getToken } from '#auth';
import {
  clicksLeaderboardTable,
  recordingsTable,
  userSettingsTable,
  userTable,
} from '~/database/schema';
import { db } from '~/server/db';

const clicksTotalAllTimeCached = defineCachedFunction(
  async () => {
    const data = await db
      .select({
        clicks_total:
          sql<string>`SUM(${clicksLeaderboardTable.clicks_given})`.as(
            'clicks_total'
          ),
      })
      .from(clicksLeaderboardTable)
      .where(eq(clicksLeaderboardTable.leaderboard, 'all time'));
    return data;
  },
  {
    maxAge: 60 * 10,
    group: 'statistics',
    name: 'clickTotals',
    getKey: () => 'allTime',
  }
);

const clicksTotalThisWeekCached = defineCachedFunction(
  async () => {
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
          eq(
            clicksLeaderboardTable.start,
            DateTime.now().startOf('week').toJSDate()
          )
        )
      );
    return data;
  },
  {
    maxAge: 60 * 10,
    group: 'statistics',
    name: 'clickTotals',
    getKey: () => 'thisWeek',
  }
);

const recordingsTableQueryBuilder = () =>
  db
    .select({
      recorded_on: recordingsTable.recorded_on,
      value: recordingsTable.value,
    })
    .from(recordingsTable)
    .orderBy(desc(recordingsTable.recorded_on))
    .limit(48);

const totalScrollsCached = defineCachedFunction(
  async () => {
    const data = await recordingsTableQueryBuilder().where(
      eq(recordingsTable.record_type, 'total_scrolls')
    );
    return data;
  },
  {
    maxAge: 60 * 60,
    group: 'statistics',
    name: 'hatcheryTotals',
    getKey: () => 'scrolls',
  }
);

const totalDragonsCached = defineCachedFunction(
  async () => {
    const data = await recordingsTableQueryBuilder().where(
      eq(recordingsTable.record_type, 'total_dragons')
    );

    return data;
  },
  {
    maxAge: 60 * 60,
    group: 'statistics',
    name: 'hatcheryTotals',
    getKey: () => 'dragons',
  }
);

export default defineEventHandler(async (event) => {
  const token = (await getToken({ event })) as JWT;
  const weekStart = DateTime.now().startOf('week');
  const weekEnd = weekStart.endOf('week');

  const [
    scrolls,
    dragons,
    clicksThisWeekLeaderboard,
    clicksAllTimeLeaderboard,
    [{ clicks_total: clicksTotalAllTime }],
    [{ clicks_this_week: clicksTotalThisWeek }],
  ] = await Promise.all([
    totalScrollsCached(),
    totalDragonsCached(),
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
        flair: userSettingsTable.flair,
      })
      .from(clicksLeaderboardTable)
      .innerJoin(userTable, eq(userTable.id, clicksLeaderboardTable.user_id))
      .innerJoin(
        userSettingsTable,
        eq(userSettingsTable.user_id, clicksLeaderboardTable.user_id)
      )
      .where(
        and(
          eq(clicksLeaderboardTable.leaderboard, 'weekly'),
          gte(clicksLeaderboardTable.start, weekStart.toJSDate()),
          or(
            eq(clicksLeaderboardTable.user_id, token?.userId),
            lte(clicksLeaderboardTable.rank, 10)
          )
        )
      )
      .orderBy(clicksLeaderboardTable.rank)
      .limit(11),
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
        flair: userSettingsTable.flair,
      })
      .from(clicksLeaderboardTable)
      .innerJoin(userTable, eq(userTable.id, clicksLeaderboardTable.user_id))
      .innerJoin(
        userSettingsTable,
        eq(userSettingsTable.user_id, clicksLeaderboardTable.user_id)
      )
      .where(
        and(
          eq(clicksLeaderboardTable.leaderboard, 'all time'),
          or(
            eq(clicksLeaderboardTable.user_id, token?.userId),
            lte(clicksLeaderboardTable.rank, 10)
          )
        )
      )
      .orderBy(clicksLeaderboardTable.rank)
      .limit(11),
    clicksTotalAllTimeCached(),
    clicksTotalThisWeekCached(),
  ]);

  // since we got them in descending order (latest 48),
  // we then have to reverse them for proper left-to-right display
  scrolls.reverse();
  dragons.reverse();

  return {
    scrolls,
    dragons,
    clicksThisWeekLeaderboard,
    clicksAllTimeLeaderboard,
    clicksTotalAllTime: parseInt(clicksTotalAllTime),
    clicksTotalThisWeek: parseInt(clicksTotalThisWeek),
    weekStart: weekStart.toISO(),
    weekEnd: weekEnd.toISO(),
  };
});
