import { and, asc, desc, eq, gte, lte, or, sql } from 'drizzle-orm';
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
    .orderBy(asc(recordingsTable.recorded_on));

const totalScrollsCached = defineCachedFunction(
  async () =>
    recordingsTableQueryBuilder().where(
      and(
        gte(
          recordingsTable.recorded_on,
          DateTime.now().minus({ hours: 24 }).toJSDate()
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
    recordingsTableQueryBuilder().where(
      and(
        gte(
          recordingsTable.recorded_on,
          DateTime.now().minus({ hours: 24 }).toJSDate()
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

const adultsCached = defineCachedFunction(
  async () =>
    recordingsTableQueryBuilder().where(
      and(
        gte(
          recordingsTable.recorded_on,
          DateTime.now().minus({ hours: 24 }).toJSDate()
        ),
        eq(recordingsTable.record_type, 'adults')
      )
    ),
  {
    maxAge: 60 * 60,
    group: 'statistics',
    name: 'hatcheryTotals',
    getKey: () => 'adults',
  }
);

const hatchlingsCached = defineCachedFunction(
  async () =>
    recordingsTableQueryBuilder().where(
      and(
        gte(
          recordingsTable.recorded_on,
          DateTime.now().minus({ hours: 24 }).toJSDate()
        ),
        eq(recordingsTable.record_type, 'hatchlings')
      )
    ),
  {
    maxAge: 60 * 60,
    group: 'statistics',
    name: 'hatcheryTotals',
    getKey: () => 'hatchlings',
  }
);

const eggsCached = defineCachedFunction(
  async () =>
    recordingsTableQueryBuilder().where(
      and(
        gte(
          recordingsTable.recorded_on,
          DateTime.now().minus({ hours: 24 }).toJSDate()
        ),
        eq(recordingsTable.record_type, 'eggs')
      )
    ),
  {
    maxAge: 60 * 60,
    group: 'statistics',
    name: 'hatcheryTotals',
    getKey: () => 'eggs',
  }
);

const hatchlingsUngenderedCached = defineCachedFunction(
  async () =>
    recordingsTableQueryBuilder().where(
      and(
        gte(
          recordingsTable.recorded_on,
          DateTime.now().minus({ hours: 24 }).toJSDate()
        ),
        eq(recordingsTable.record_type, 'hatchlings_ungendered')
      )
    ),
  {
    maxAge: 60 * 60,
    group: 'statistics',
    name: 'hatcheryTotals',
    getKey: () => 'hatchlingsUngendered',
  }
);

const hatchlingsFemaleCached = defineCachedFunction(
  async () =>
    recordingsTableQueryBuilder().where(
      and(
        gte(
          recordingsTable.recorded_on,
          DateTime.now().minus({ hours: 24 }).toJSDate()
        ),
        eq(recordingsTable.record_type, 'hatchlings_female')
      )
    ),
  {
    maxAge: 60 * 60,
    group: 'statistics',
    name: 'hatcheryTotals',
    getKey: () => 'hatchlingsFemale',
  }
);

const hatchlingsMaleCached = defineCachedFunction(
  async () =>
    recordingsTableQueryBuilder().where(
      and(
        gte(
          recordingsTable.recorded_on,
          DateTime.now().minus({ hours: 24 }).toJSDate()
        ),
        eq(recordingsTable.record_type, 'hatchlings_male')
      )
    ),
  {
    maxAge: 60 * 60,
    group: 'statistics',
    name: 'hatcheryTotals',
    getKey: () => 'hatchlingsMale',
  }
);

const userActivityCached = defineCachedFunction(
  async () =>
    db
      .select({
        recorded_on: recordingsTable.recorded_on,
        value: recordingsTable.value,
      })
      .from(recordingsTable)
      .where(
        and(
          gte(
            recordingsTable.recorded_on,
            DateTime.now().minus({ hours: 24 }).toJSDate()
          ),
          eq(recordingsTable.record_type, 'user_count')
        )
      )
      .orderBy(asc(recordingsTable.recorded_on)),
  {
    maxAge: 60 * 15,
    group: 'statistics',
    name: 'userActivity',
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
    userActivity,
    adults,
    hatchlings,
    eggs,
    hatchlingsUngendered,
    hatchlingsFemale,
    hatchlingsMale,
  ] = await Promise.all([
    totalScrollsCached(),
    totalDragonsCached(),
    db
      .select({
        rank: clicksLeaderboardTable.rank,
        username: sql<string>`
          CASE
            WHEN (${clicksLeaderboardTable.user_id} = ${token.userId} AND ${userSettingsTable.anonymiseStatistics} = 1) THEN -1
            WHEN ${userSettingsTable.anonymiseStatistics} = 1 THEN -2
            ELSE ${userTable.username}
          END`.as('username'),
        clicks_given: clicksLeaderboardTable.clicks_given,
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
            WHEN (${clicksLeaderboardTable.user_id} = ${token.userId} AND ${userSettingsTable.anonymiseStatistics} = 1) THEN -1
            WHEN ${userSettingsTable.anonymiseStatistics} = 1 THEN -2
            ELSE ${userTable.username}
          END`.as('username'),
        clicks_given: clicksLeaderboardTable.clicks_given,
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
    userActivityCached(),
    adultsCached(),
    hatchlingsCached(),
    eggsCached(),
    hatchlingsUngenderedCached(),
    hatchlingsFemaleCached(),
    hatchlingsMaleCached(),
  ]);

  return {
    scrolls,
    dragons,
    clicksThisWeekLeaderboard,
    clicksAllTimeLeaderboard,
    clicksTotalAllTime: parseInt(clicksTotalAllTime),
    clicksTotalThisWeek: parseInt(clicksTotalThisWeek),
    weekStart: weekStart.toISO(),
    weekEnd: weekEnd.toISO(),
    userActivity,
    adults,
    hatchlings,
    eggs,
    hatchlingsUngendered,
    hatchlingsFemale,
    hatchlingsMale,
  };
});
