import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { DateTime } from 'luxon';
import {
  clicksTable,
  recordingsTable,
  userSettingsTable,
  userTable,
} from '~/database/schema';
import { db } from '~/server/db';

export default defineCachedEventHandler(
  async () => {
    const qb = () =>
      db
        .select({
          recorded_on: recordingsTable.recorded_on,
          value: recordingsTable.value,
        })
        .from(recordingsTable)
        .orderBy(desc(recordingsTable.recorded_on))
        .limit(48);

    const [
      scrolls,
      dragons,
      clicksLeaderboard,
      [{ clicks_total: clicksTotal }],
    ] = await Promise.all([
      qb().where(eq(recordingsTable.record_type, 'total_scrolls')),
      qb().where(eq(recordingsTable.record_type, 'total_dragons')),
      db
        .select({
          anonymiseStatistics: userSettingsTable.anonymiseStatistics,
          username: userTable.username,
          clicks_given: sql<number>`COUNT(*)`.as('clicks_given'),
        })
        .from(clicksTable)
        .innerJoin(userTable, eq(userTable.id, clicksTable.user_id))
        .innerJoin(
          userSettingsTable,
          eq(userSettingsTable.user_id, clicksTable.user_id)
        )
        .where(
          gte(clicksTable.clicked_on, DateTime.now().startOf('week').toJSDate())
        )
        .groupBy(userTable.id)
        .having(and(gte(sql<number>`clicks_given`, 50)))
        .orderBy(desc(sql`clicks_given`)),
      db
        .select({ clicks_total: sql<number>`COUNT(*)`.as('clicks_total') })
        .from(clicksTable),
    ]);

    // since we got them in descending order (latest 48),
    // we then have to reverse them for proper left-to-right display
    scrolls.reverse();
    dragons.reverse();

    return {
      scrolls,
      dragons,
      clicksLeaderboard: clicksLeaderboard.map((row) => ({
        username: row.anonymiseStatistics ? null : row.username,
        clicks_given: row.clicks_given,
      })),
      clicksTotal,
    };
  },
  {
    maxAge: 30,
  }
);
