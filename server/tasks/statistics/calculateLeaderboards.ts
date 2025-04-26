import { db } from '~/server/db';
import {
  clicksLeaderboardsTable,
  clicksTable,
  itemsTable,
  userTrophyTable,
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
        .delete(clicksLeaderboardsTable)
        .where(
          and(
            eq(clicksLeaderboardsTable.leaderboard, 'weekly'),
            eq(clicksLeaderboardsTable.start, weekStart.toJSDate())
          )
        );

      // Recalculate the weekly leaderboard
      await tx.execute(
        sql`INSERT INTO ${clicksLeaderboardsTable}
      (
        ${clicksLeaderboardsTable.userId},
        ${clicksLeaderboardsTable.leaderboard},
        ${clicksLeaderboardsTable.rank},
        ${clicksLeaderboardsTable.clicksGiven},
        ${clicksLeaderboardsTable.start}
      )
      WITH cte AS (
        SELECT
          leaderboard.user_id,
          @rank := IF(@prev_clicks = leaderboard.clicks_given, @rank, @rank + 1) AS rank,
          leaderboard.clicks_given, 
          @prev_clicks := leaderboard.clicks_given
        FROM (
          SELECT ${clicksTable.userId}, COUNT(*) AS clicks_given
          FROM ${clicksTable}
          WHERE ${clicksTable.clickedOn} >= ${weekStart.toSQL({ includeOffset: false })}
          AND ${clicksTable.clickedOn} < ${weekEnd.toSQL({ includeOffset: false })}
          GROUP BY ${clicksTable.userId}
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
        .delete(clicksLeaderboardsTable)
        .where(eq(clicksLeaderboardsTable.leaderboard, 'all time'));
      await tx.execute(sql`INSERT INTO ${clicksLeaderboardsTable}
      (
        ${clicksLeaderboardsTable.userId},
        ${clicksLeaderboardsTable.leaderboard},
        ${clicksLeaderboardsTable.rank},
        ${clicksLeaderboardsTable.clicksGiven},
        ${clicksLeaderboardsTable.start}
      )
      SELECT
        leaderboard.user_id,
        'all time',
        (@rank := @rank + 1),
        leaderboard.clicks_given,
        '1970-01-01 00:00:00'
      FROM (
        SELECT
          ${clicksLeaderboardsTable.userId},
          SUM(${clicksLeaderboardsTable.clicksGiven}) AS clicks_given
        FROM ${clicksLeaderboardsTable}
        WHERE ${clicksLeaderboardsTable.leaderboard} = 'weekly'
        GROUP BY ${clicksLeaderboardsTable.userId}
        ORDER BY clicks_given DESC
      ) AS leaderboard`);

      if (newWeek) {
        const top10 = await tx
          .select({
            itemId: itemsTable.id,
            userId: clicksLeaderboardsTable.userId,
          })
          .from(clicksLeaderboardsTable)
          .innerJoin(
            itemsTable,
            and(
              eq(itemsTable.category, 'trophy'),
              like(
                itemsTable.url,
                sql`CONCAT('trophies/', ${clicksLeaderboardsTable.rank}, '.%')`
              )
            )
          )
          .where(
            and(
              eq(clicksLeaderboardsTable.leaderboard, 'weekly'),
              eq(clicksLeaderboardsTable.start, weekStart.toJSDate()),
              between(clicksLeaderboardsTable.rank, 1, 10)
            )
          );

        await tx.insert(userTrophyTable).values(
          top10.map((row) => ({
            itemId: row.itemId,
            userId: row.userId,
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
