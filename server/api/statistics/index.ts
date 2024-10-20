import { and, desc, eq, gt, lte, or, sql } from 'drizzle-orm';
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
import weekly from './weekly';

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

const weekliesCached = defineCachedFunction(
  async () => {
    const data = await db
      .selectDistinct({
        start: clicksLeaderboardTable.start,
      })
      .from(clicksLeaderboardTable)
      .where(
        and(
          eq(clicksLeaderboardTable.leaderboard, 'weekly'),
          gt(
            clicksLeaderboardTable.start,
            DateTime.fromSQL('2024-09-28 20:55:00Z').toJSDate()
          )
        )
      )
      .orderBy(desc(clicksLeaderboardTable.start));
    return data.map((row, index) => ({
      ...row,
      week: data.length - index,
    }));
  },
  {
    maxAge: 1,
    group: 'statistics',
    name: 'leaderboards',
    getKey: () => 'weeklies',
  }
);

export default defineEventHandler(async (event) => {
  const token = (await getToken({ event })) as JWT;

  const [
    scrolls,
    dragons,
    clicksThisWeekLeaderboard,
    clicksAllTimeLeaderboard,
    [{ clicks_total: clicksTotalAllTime }],
    weeklies,
  ] = await Promise.all([
    totalScrollsCached(),
    totalDragonsCached(),
    weekly(event),
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
    weekliesCached(),
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
    weeklies,
  };
});
