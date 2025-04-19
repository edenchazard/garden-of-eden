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
      .orderBy(asc(recordingsTable.recordedOn))
      .where(
        and(
          gte(
            recordingsTable.recordedOn,
            DateTime.now().minus({ hours: 24 }).toSQL()
          ),
          eq(recordingsTable.recordType, 'total_scrolls')
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
      .orderBy(asc(recordingsTable.recordedOn))
      .where(
        and(
          gte(
            recordingsTable.recordedOn,
            DateTime.now().minus({ hours: 24 }).toSQL()
          ),
          eq(recordingsTable.recordType, 'total_dragons')
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
        clicksTotal: sql<string>`SUM(${clicksLeaderboardTable.clicksGiven})`.as(
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
            recordingsTable.recordedOn,
            DateTime.now().minus({ hours: 24 }).toSQL()
          ),
          eq(recordingsTable.recordType, 'user_count')
        )
      )
      .orderBy(asc(recordingsTable.recordedOn)),
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
            recordingsTable.recordedOn,
            DateTime.now().minus({ hours: 24 }).toSQL()
          ),
          eq(recordingsTable.recordType, 'clean_up')
        )
      )
      .orderBy(asc(recordingsTable.recordedOn)),
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
            recordingsTable.recordedOn,
            DateTime.now().minus({ hours: 24 }).toSQL()
          ),
          eq(recordingsTable.recordType, 'api_request')
        )
      )
      .orderBy(asc(recordingsTable.recordedOn)),
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
    [{ clicksTotal: clicksTotalAllTime }],
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
            WHEN (${clicksLeaderboardTable.userId} = ${token?.userId ?? null} AND ${userSettingsTable.anonymiseStatistics} = 1) THEN -1
            WHEN ${userSettingsTable.anonymiseStatistics} = 1 THEN -2
            ELSE ${userTable.username}
          END`.as('username'),
        clicksGiven: clicksLeaderboardTable.clicksGiven,
        flair: {
          url: itemsTable.url,
          name: itemsTable.name,
          description: itemsTable.description,
          artist: itemsTable.artist,
        },
      })
      .from(clicksLeaderboardTable)
      .innerJoin(userTable, eq(userTable.id, clicksLeaderboardTable.userId))
      .innerJoin(
        userSettingsTable,
        eq(userSettingsTable.userId, clicksLeaderboardTable.userId)
      )
      .leftJoin(itemsTable, eq(userSettingsTable.flairId, itemsTable.id))
      .where(
        and(
          eq(clicksLeaderboardTable.leaderboard, 'all time'),
          or(
            eq(clicksLeaderboardTable.userId, token?.userId),
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
