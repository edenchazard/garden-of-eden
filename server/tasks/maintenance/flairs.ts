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
      .set({ flair_id: null })
      .where(
        and(
          isNotNull(userSettingsTable.flair_id),
          notInArray(
            userSettingsTable.user_id,
            db
              .select({
                user_id: purchasesTable.user_id,
              })
              .from(purchasesTable)
              .innerJoin(itemsTable, eq(purchasesTable.item_id, itemsTable.id))
              .where(
                and(
                  eq(userSettingsTable.user_id, purchasesTable.user_id),
                  gte(purchasesTable.purchased_on, sql`NOW() - INTERVAL 7 DAY`),
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
