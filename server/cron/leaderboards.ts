import { defineCronHandler } from '#nuxt/cron';
import { db } from '../db';
import { clicksLeaderboardTable, clicksTable } from '~/database/schema';
import { and, eq, sql } from 'drizzle-orm';
import { DateTime } from 'luxon';

export default defineCronHandler('everyFiveMinutes', async () => {
  const now = DateTime.now();
  const currentWeekStart = now.startOf('week');
  const previousWeekStart = currentWeekStart.minus({ weeks: 1 });

  let weekStart = currentWeekStart;
  let weekEnd = currentWeekStart.plus({ weeks: 1 });
  let newWeek = false;

  // Check if we're in the first five minutes of a new week
  if (now.diff(currentWeekStart, 'minutes').minutes < 5) {
    // We're at the start of a new week, so amend the final standings for the previous week
    weekStart = previousWeekStart;
    weekEnd = currentWeekStart;
    newWeek = true;
  }

  await db.transaction(async (tx) => {
    // Delete existing weekly leaderboard entries for the calculated weekStart
    await tx
      .delete(clicksLeaderboardTable)
      .where(
        and(
          eq(clicksLeaderboardTable.leaderboard, 'weekly'),
          eq(clicksLeaderboardTable.start, weekStart.toJSDate())
        )
      );

    // Recalculate the weekly leaderboard
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
          AND ${clicksTable.clicked_on} < ${weekEnd.toSQL({ includeOffset: false })}
          GROUP BY ${clicksTable.user_id}
          ORDER BY clicks_given DESC
        ) AS leaderboard`
    );

    // Recalculate the all-time leaderboard by summing the weekly leaderboards
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
          SUM(${clicksLeaderboardTable.clicks_given}) AS clicks_given
        FROM ${clicksLeaderboardTable}
        WHERE ${clicksLeaderboardTable.leaderboard} = 'weekly'
        GROUP BY ${clicksLeaderboardTable.user_id}
        ORDER BY clicks_given DESC
      ) AS leaderboard`);
  });

  // Clear cached totals
  const promises = [
    useStorage('cache').removeItem('statistics:clickTotals:allTime.json'),
    useStorage('cache').removeItem(
      `statistics:clickTotals:week-${weekStart.toISO()}.json`
    ),
  ];

  if (newWeek) {
    promises.push(
      useStorage('cache').removeItem(`statistics:clickTotals:weeklies.json`)
    );
  }

  await Promise.all(promises);
});
