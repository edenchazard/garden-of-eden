import { and, asc, desc, eq, gt, gte, lte, or, sql } from 'drizzle-orm';
import { DateTime } from 'luxon';
import type { JWT } from 'next-auth/jwt';
import { getToken } from '#auth';
import {
  clicksLeaderboardsTable,
  itemsTable,
  recordingsTable,
  usersSettingsTable,
  usersTable,
} from '~~/database/schema';
import { db } from '~~/server/db';

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
        clicksTotal:
          sql<string>`SUM(${clicksLeaderboardsTable.clicksGiven})`.as(
            'clicks_total'
          ),
      })
      .from(clicksLeaderboardsTable)
      .where(eq(clicksLeaderboardsTable.leaderboard, 'all time'));
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
        start: clicksLeaderboardsTable.start,
      })
      .from(clicksLeaderboardsTable)
      .where(
        and(
          eq(clicksLeaderboardsTable.leaderboard, 'weekly'),
          gt(
            clicksLeaderboardsTable.start,
            DateTime.fromSQL('2024-09-28 20:55:00Z').toJSDate()
          )
        )
      )
      .orderBy(desc(clicksLeaderboardsTable.start));
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
          eq(clicksLeaderboardsTable.leaderboard, 'all time'),
          or(
            eq(clicksLeaderboardsTable.userId, token?.userId),
            lte(clicksLeaderboardsTable.rank, 10)
          )
        )
      )
      .orderBy(clicksLeaderboardsTable.rank)
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
