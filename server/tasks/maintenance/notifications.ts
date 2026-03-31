import { userNotificationTable } from '~~/database/schema';
import { db } from '~~/server/db';
import { DateTime } from 'luxon';
import { lte, or, sql } from 'drizzle-orm';

export default defineTask({
  meta: {
    description: 'Delete notifications older than 28 days or expired.',
  },
  async run() {
    await db
      .delete(userNotificationTable)
      .where(
        or(
          lte(
            userNotificationTable.createdAt,
            sql`${DateTime.now().minus({ days: 28 }).toSQL()}`
          ),
          lte(userNotificationTable.validUntil, sql`NOW()`)
        )
      );
    return {
      result: 'success',
    };
  },
});
