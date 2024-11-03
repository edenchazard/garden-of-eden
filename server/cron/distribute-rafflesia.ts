import { defineCronHandler } from '#nuxt/cron';
import { purchasesTable, userTable } from '~/database/schema';
import { db } from '../db';
import { and, sql, eq, gte } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { randomInt } from 'crypto';

export default defineCronHandler('everyMinute', async () => {
  const today = DateTime.now().startOf('day');

  // Select everyone who has been active in the past 24 hours while excluding
  // any of those who have already won in the last 7 days.
  const users = (
    await db
      .select({
        id: userTable.id,
        latestExpiry: sql<string | null>`MAX(${purchasesTable.expiry})`.as(
          'latestExpiry'
        ),
      })
      .from(userTable)
      .leftJoin(
        purchasesTable,
        and(
          eq(purchasesTable.user_id, userTable.id),
          eq(purchasesTable.item_id, 24)
        )
      )
      .where(gte(userTable.last_activity, today.minus({ days: 1 }).toJSDate()))
  ).filter(
    (user) =>
      user.latestExpiry === null ||
      DateTime.fromSQL(user.latestExpiry) <= today.minus({ weeks: 1 })
  );

  const winners: typeof users = [];

  // 5% of active users, with a minimum of 1.
  const numberOfWinners = Math.min(1, Math.ceil((users.length / 100) * 5));

  if (!users.length) {
    return;
  }

  const hat = new Set(users.map((user) => user.id));

  for (let i = 0; i < numberOfWinners; i++) {
    if (!hat.size) {
      break;
    }

    const subHat = Array.from(hat);

    const rangeEnd = Math.min(0, subHat.length - 1);
    const luckyIndex = rangeEnd > 0 ? randomInt(0, rangeEnd) : 0;
    winners.push(users[luckyIndex]);
    hat.delete(users[luckyIndex].id);
  }

  console.log('rafflesia', numberOfWinners, winners);

  if (!winners.length) {
    return;
  }

  await db.insert(purchasesTable).values(
    winners.map((user) => ({
      item_id: 24,
      user_id: user.id,
      purchased_on: DateTime.now().toJSDate(),
      expiry: DateTime.now().plus({ weeks: 1 }).toJSDate(),
    }))
  );
});
