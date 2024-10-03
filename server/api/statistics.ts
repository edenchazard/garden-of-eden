import { and, desc, eq, gte, lte, or, sql } from 'drizzle-orm';
import { DateTime } from 'luxon';
import type { JWT } from 'next-auth/jwt';
import { getToken } from '#auth';
import {
  clicksLeaderboardTable,
  clicksTable,
  recordingsTable,
  userSettingsTable,
  userTable,
} from '~/database/schema';
import { db } from '~/server/db';

const clicksTotalAllTimeCached = defineCachedFunction(
  async () => {
    const data = await db
      .select({
        clicks_total: sql<number>`COUNT(*)`.as('clicks_total'),
      })
      .from(clicksTable);
    return data;
  },
  {
    maxAge: 30,
    getKey: () => 'clicksTotalAllTime',
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
  { maxAge: 30, getKey: () => 'totalScrolls' }
);

const totalDragonsCached = defineCachedFunction(
  async () => {
    const data = await recordingsTableQueryBuilder().where(
      eq(recordingsTable.record_type, 'total_dragons')
    );

    return data;
  },
  { maxAge: 30, getKey: () => 'totalDragons' }
);

export default defineEventHandler(async (event) => {
  const token = (await getToken({ event })) as JWT;

  const [
    scrolls,
    dragons,
    clicksLeaderboard,
    [{ clicks_total: clicksTotalAllTime }],
  ] = await Promise.all([
    totalScrollsCached(),
    totalDragonsCached(),
    db
      .select({
        anonymiseStatistics: userSettingsTable.anonymiseStatistics,
        rank: clicksLeaderboardTable.rank,
        username: userTable.username,
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
          gte(
            clicksLeaderboardTable.start,
            DateTime.now().startOf('week').toJSDate()
          ),
          or(
            eq(clicksLeaderboardTable.user_id, token.userId),
            lte(clicksLeaderboardTable.rank, 10)
          )
        )
      )
      .orderBy(clicksLeaderboardTable.rank)
      .limit(11),
    clicksTotalAllTimeCached(),
  ]);

  // since we got them in descending order (latest 48),
  // we then have to reverse them for proper left-to-right display
  scrolls.reverse();
  dragons.reverse();

  return {
    scrolls,
    dragons,
    clicksLeaderboard: clicksLeaderboard.map((row) => ({
      rank: row.rank,
      username: row.anonymiseStatistics ? null : row.username,
      clicks_given: row.clicks_given,
    })),
    clicksTotalAllTime,
  };
});
