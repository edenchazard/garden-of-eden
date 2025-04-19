import {
  itemsTable,
  purchasesTable,
  userSettingsTable,
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
      .update(userSettingsTable)
      .set({ flairId: null })
      .where(
        and(
          isNotNull(userSettingsTable.flairId),
          notInArray(
            userSettingsTable.userId,
            db
              .select({
                userId: purchasesTable.userId,
              })
              .from(purchasesTable)
              .innerJoin(itemsTable, eq(purchasesTable.itemId, itemsTable.id))
              .where(
                and(
                  eq(userSettingsTable.userId, purchasesTable.userId),
                  gte(purchasesTable.purchasedOn, sql`NOW() - INTERVAL 7 DAY`),
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
