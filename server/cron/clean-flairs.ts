import { defineCronHandler } from '#nuxt/cron';
import { purchasesTable, userSettingsTable } from '~/database/schema';
import { db } from '../db';
import { and, sql, eq, notInArray, gte } from 'drizzle-orm';

export default defineCronHandler('everyFiveMinutes', async () => {
  await db
    .update(userSettingsTable)
    .set({ flair_id: null })
    .where(
      notInArray(
        userSettingsTable.user_id,
        db
          .select({
            user_id: purchasesTable.user_id,
          })
          .from(purchasesTable)
          .where(
            and(
              eq(userSettingsTable.user_id, purchasesTable.user_id),
              gte(purchasesTable.purchased_on, sql`NOW() - INTERVAL 7 DAY`)
            )
          )
      )
    );
});
