import {
  itemsTable,
  userItemTable,
  usersSettingsTable,
  usersTable,
  userTrophyTable,
} from '~/database/schema';
import { db } from '~/server/db';
import { getToken } from '#auth';
import type { JWT } from 'next-auth/jwt';
import { and, eq } from 'drizzle-orm';
import { DateTime, Interval } from 'luxon';
import { z } from 'zod';

export default defineEventHandler(async (event) => {
  const schema = z.object({
    id: z.coerce.number(),
  });

  const [token, params] = await Promise.all([
    getToken({ event }) as Promise<JWT>,
    getValidatedRouterParams(event, schema.parse),
  ]);

  const [item] = await db
    .select()
    .from(itemsTable)
    .where(eq(itemsTable.id, params.id));

  if (!item) {
    return setResponseStatus(event, 404);
  }

  // Availability check.
  const now = new Date();

  if (
    item.availableFrom &&
    item.availableTo &&
    Interval.fromDateTimes(
      DateTime.fromSQL(item.availableFrom),
      DateTime.fromSQL(item.availableTo)
    ).contains(DateTime.fromJSDate(now)) === false
  ) {
    return setResponseStatus(event, 404);
  }

  // Cannot be purchased check.
  if (item.cost === null) {
    return setResponseStatus(event, 404);
  }

  // User has enough money check.
  const [user] = await db
    .select({ money: usersTable.money })
    .from(usersTable)
    .where(eq(usersTable.id, token.userId));

  if (item.cost && user.money < item.cost) {
    return setResponseStatus(event, 404);
  }

  const reward = await db.transaction(async (tx) => {
    await db.insert(userItemTable).values({
      itemId: params.id,
      userId: token.userId,
    });

    await tx
      .update(usersTable)
      .set({
        money: user.money - (item?.cost ?? 0),
      })
      .where(eq(usersTable.id, token.userId));

    if (item.category === 'flair') {
      await tx
        .update(usersSettingsTable)
        .set({
          flairId: params.id,
        })
        .where(eq(usersSettingsTable.userId, token.userId));
    }

    // New Year 2025 badge.
    if (item.name === 'Fortune Cookie' && now.getFullYear() === 2025) {
      const [badge] = await tx
        .select()
        .from(itemsTable)
        .where(eq(itemsTable.id, 50));

      // Check they don't already have the badge.
      const hasBadge = await tx
        .select({
          id: userTrophyTable.id,
        })
        .from(userTrophyTable)
        .where(
          and(
            eq(userTrophyTable.itemId, badge.id),
            eq(userTrophyTable.userId, token.userId)
          )
        )
        .limit(1);

      if (!hasBadge.length) {
        await tx.insert(userTrophyTable).values({
          itemId: badge.id,
          userId: token.userId,
          awardedOn: now,
        });

        return badge;
      }
    }
  });

  return { reward };
});
