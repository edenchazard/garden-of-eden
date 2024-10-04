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
  });
});