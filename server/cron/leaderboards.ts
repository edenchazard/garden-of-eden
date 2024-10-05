import { defineCronHandler } from '#nuxt/cron';
import { db } from '../db';
import { clicksLeaderboardTable, clicksTable } from '~/database/schema';
import { and, eq, sql } from 'drizzle-orm';
import { DateTime } from 'luxon';

export default defineCronHandler('everyFiveMinutes', async () => {
  const weekStart = DateTime.now().startOf('week');
  await db.transaction(async (tx) => {
    await tx
      .delete(clicksLeaderboardTable)
      .where(
        and(
          eq(clicksLeaderboardTable.leaderboard, 'weekly'),
          eq(clicksLeaderboardTable.start, weekStart.toJSDate())
        )
      );

    await tx.execute(sql`SET @rank:= 0`);
    await tx.execute(
      sql`INSERT INTO ${clicksLeaderboardTable}
        (
          ${clicksLeaderboardTable.user_id},
          ${clicksLeaderboardTable.leaderboard},
          ${clicksLeaderboardTable.rank},
          ${clicksLeaderboardTable.clicks_given},
          ${clicksLeaderboardTable.start}
        )
      SELECT
        leaderboard.user_id,
        'weekly',
        (@rank := @rank + 1),
        leaderboard.clicks_given, 
        ${weekStart.toSQL({ includeOffset: false })}
        FROM (
          SELECT
            ${clicksTable.user_id},
            COUNT(*) AS clicks_given
          FROM ${clicksTable}
          WHERE ${clicksTable.clicked_on} >= ${weekStart.toSQL({ includeOffset: false })}
          GROUP BY ${clicksTable.user_id}
          ORDER BY clicks_given DESC
        ) AS leaderboard`
    );
    // all time leaderboard
    await tx.execute(sql`SET @rank:= 0`);
    await tx
      .delete(clicksLeaderboardTable)
      .where(eq(clicksLeaderboardTable.leaderboard, 'all time'));
    await tx.execute(sql`INSERT INTO ${clicksLeaderboardTable}
      (
        ${clicksLeaderboardTable.user_id},
        ${clicksLeaderboardTable.leaderboard},
        ${clicksLeaderboardTable.rank},
        ${clicksLeaderboardTable.clicks_given},
        ${clicksLeaderboardTable.start}
      )
      SELECT
        leaderboard.user_id,
        'all time',
        (@rank := @rank + 1),
        leaderboard.clicks_given,
        '1970-01-01 00:00:00'
      FROM (
        SELECT
          ${clicksLeaderboardTable.user_id},
          SUM(clicks_given) AS clicks_given
        FROM ${clicksLeaderboardTable}
        WHERE ${clicksLeaderboardTable.leaderboard} = 'weekly'
        GROUP BY ${clicksLeaderboardTable.user_id}
        ORDER BY clicks_given DESC
      ) AS leaderboard`);
  });

  // Clear totals.
  await Promise.all([
    useStorage('cache').removeItem('statistics:clickTotals:allTime.json'),
    useStorage('cache').removeItem('statistics:clickTotals:thisWeek.json'),
  ]);
});
