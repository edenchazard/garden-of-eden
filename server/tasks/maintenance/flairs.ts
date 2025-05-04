import {
  itemsTable,
  userItemTable,
  usersSettingsTable,
} from '~/database/schema';
import { db } from '~/server/db';
import { and, sql, eq, notInArray, gte, isNotNull } from 'drizzle-orm';

export default defineTask({
  meta: {
    description:
      'Remove flairs from users who have not purchased them recently.',
  },
  async run() {
    await db
      .update(usersSettingsTable)
      .set({ flairId: null })
      .where(
        and(
          isNotNull(usersSettingsTable.flairId),
          notInArray(
            usersSettingsTable.userId,
            db
              .select({
                userId: userItemTable.userId,
              })
              .from(userItemTable)
              .innerJoin(itemsTable, eq(userItemTable.itemId, itemsTable.id))
              .where(
                and(
                  eq(usersSettingsTable.userId, userItemTable.userId),
                  gte(userItemTable.purchasedOn, sql`NOW() - INTERVAL 7 DAY`),
                  eq(itemsTable.category, 'flair')
                )
              )
          )
        )
      );

    return {
      result: 'success',
    };
  },
});
