import { defineCronHandler } from '#nuxt/cron';
import { userNotificationsTable } from '~/database/schema';
import { db } from '~/server/db';
import { DateTime } from 'luxon';
import { lte, or, sql } from 'drizzle-orm';

export default defineCronHandler('daily', async () => {
  await db
    .delete(userNotificationsTable)
    .where(
      or(
        lte(
          userNotificationsTable.createdAt,
          sql`${DateTime.now().minus({ days: 28 }).toSQL()}`
        ),
        lte(userNotificationsTable.validUntil, sql`NOW()`)
      )
    );
});
