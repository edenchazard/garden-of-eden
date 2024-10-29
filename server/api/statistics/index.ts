import { and, asc, desc, eq, gt, gte, lte, or, sql } from 'drizzle-orm';
import { DateTime } from 'luxon';
import type { JWT } from 'next-auth/jwt';
import { getToken } from '#auth';
import {
  clicksLeaderboardTable,
  itemsTable,
  recordingsTable,
  userSettingsTable,
  userTable,
} from '~/database/schema';
import { db } from '~/server/db';

const totalScrollsCached = defineCachedFunction(
  async () =>
    db
      .select()
      .from(recordingsTable)
      .orderBy(asc(recordingsTable.recorded_on))
      .where(
        and(
          gte(
            recordingsTable.recorded_on,
            DateTime.now().minus({ hours: 24 }).toSQL()
          ),
          eq(recordingsTable.record_type, 'total_scrolls')
        )
      ),
  {
    maxAge: 60 * 60,
    group: 'statistics',
    name: 'hatcheryTotals',
    getKey: () => 'scrolls',
  }
);

const totalDragonsCached = defineCachedFunction(
  async () =>
    db
      .select()
      .from(recordingsTable)
      .orderBy(asc(recordingsTable.recorded_on))
      .where(
        and(
          gte(
            recordingsTable.recorded_on,
            DateTime.now().minus({ hours: 24 }).toSQL()
          ),
          eq(recordingsTable.record_type, 'total_dragons')
        )
      ),
  {
    maxAge: 60 * 60,
    group: 'statistics',
    name: 'hatcheryTotals',
    getKey: () => 'dragons',
  }
);

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
    maxAge: 60 * 60 * 24 * 7,
    group: 'statistics',
    name: 'clickTotals',
    getKey: () => 'weeklies',
  }
);

const userActivityCached = defineCachedFunction(
  async () =>
    db
      .select()
      .from(recordingsTable)
      .where(
        and(
          gte(
            recordingsTable.recorded_on,
            DateTime.now().minus({ hours: 24 }).toSQL()
          ),
          eq(recordingsTable.record_type, 'user_count')
        )
      )
      .orderBy(asc(recordingsTable.recorded_on)),
  {
    maxAge: 60 * 15,
    group: 'statistics',
    name: 'userActivity',
    getKey: () => 'activity',
  }
);

const cleanUpCached = defineCachedFunction(
  async () =>
    db
      .select()
      .from(recordingsTable)
      .where(
        and(
          gte(
            recordingsTable.recorded_on,
            DateTime.now().minus({ hours: 24 }).toSQL()
          ),
          eq(recordingsTable.record_type, 'clean_up')
        )
      )
      .orderBy(asc(recordingsTable.recorded_on)),
  {
    maxAge: 60 * 10,
    group: 'statistics',
    name: 'hatcheryTotals',
    getKey: () => 'cleanUp',
  }
);

const apiRequestsCached = defineCachedFunction(
  async () =>
    db
      .select()
      .from(recordingsTable)
      .where(
        and(
          gte(
            recordingsTable.recorded_on,
            DateTime.now().minus({ hours: 24 }).toSQL()
          ),
          eq(recordingsTable.record_type, 'api_request')
        )
      )
      .orderBy(asc(recordingsTable.recorded_on)),
  {
    maxAge: 60 * 10,
    group: 'statistics',
    name: 'api',
    getKey: () => 'requests',
  }
);

export default defineEventHandler(async (event) => {
  const token = (await getToken({ event })) as JWT;

  const [
    apiRequests,
    cleanUp,
    scrolls,
    dragons,
    clicksAllTimeLeaderboard,
    [{ clicks_total: clicksTotalAllTime }],
    weeklies,
    userActivity,
  ] = await Promise.all([
    apiRequestsCached(),
    cleanUpCached(),
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
    userActivityCached(),
  ]);

  return {
    apiRequests,
    cleanUp,
    scrolls,
    dragons,
    clicksAllTimeLeaderboard,
    clicksTotalAllTime: parseInt(clicksTotalAllTime),
    weeklies,
    userActivity,
  };
});
