import { db } from '~/server/db';
import {
  clicksLeaderboardTable,
  clicksTable,
  itemsTable,
  userTrophiesTable,
} from '~/database/schema';
import { and, between, eq, like, sql } from 'drizzle-orm';
import { DateTime } from 'luxon';

export default defineTask({
  meta: {
    description:
      'Recalculate and update the weekly leaderboard and all-time leaderboard.',
  },
  async run() {
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
      await tx.execute(
        sql`INSERT INTO ${clicksLeaderboardTable}
      (
        ${clicksLeaderboardTable.user_id},
        ${clicksLeaderboardTable.leaderboard},
        ${clicksLeaderboardTable.rank},
        ${clicksLeaderboardTable.clicks_given},
        ${clicksLeaderboardTable.start}
      )
      WITH cte AS (
        SELECT
          leaderboard.user_id,
          @rank := IF(@prev_clicks = leaderboard.clicks_given, @rank, @rank + 1) AS rank,
          leaderboard.clicks_given, 
          @prev_clicks := leaderboard.clicks_given
        FROM (
          SELECT ${clicksTable.user_id}, COUNT(*) AS clicks_given
          FROM ${clicksTable}
          WHERE ${clicksTable.clicked_on} >= ${weekStart.toSQL({ includeOffset: false })}
          AND ${clicksTable.clicked_on} < ${weekEnd.toSQL({ includeOffset: false })}
          GROUP BY ${clicksTable.user_id}
          ORDER BY clicks_given DESC
        ) AS leaderboard,
        (SELECT @rank := 0, @prev_clicks := NULL) AS vars
      )
      SELECT user_id, "weekly", rank, clicks_given, ${weekStart.toSQL({ includeOffset: false })}
      FROM cte;
      `
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

      if (newWeek) {
        const top10 = await tx
          .select({
            item_id: itemsTable.id,
            user_id: clicksLeaderboardTable.user_id,
          })
          .from(clicksLeaderboardTable)
          .innerJoin(
            itemsTable,
            and(
              eq(itemsTable.category, 'trophy'),
              like(
                itemsTable.url,
                sql`CONCAT('trophies/', ${clicksLeaderboardTable.rank}, '.%')`
              )
            )
          )
          .where(
            and(
              eq(clicksLeaderboardTable.leaderboard, 'weekly'),
              eq(clicksLeaderboardTable.start, weekStart.toJSDate()),
              between(clicksLeaderboardTable.rank, 1, 10)
            )
          );

        await tx.insert(userTrophiesTable).values(
          top10.map((row) => ({
            itemId: row.item_id,
            userId: row.user_id,
            awardedOn: weekEnd.toJSDate(),
          }))
        );
      }
    });

    // Clear cached totals
    const promises = [
      useStorage('cache').removeItem('statistics:clickTotals:allTime.json'),
      useStorage('cache').removeItem(
        `statistics:clickTotals:week-${weekStart.toISO()}.json`
      ),
      useStorage('cache').removeItem(
        `statistics:clickTotals:week-${weekStart.toISO()}-daily-totals.json`
      ),
    ];

    if (newWeek) {
      promises.push(
        useStorage('cache').removeItem(`statistics:clickTotals:weeklies.json`)
      );
    }

    await Promise.all(promises);

    return { result: 'success' };
  },
});
