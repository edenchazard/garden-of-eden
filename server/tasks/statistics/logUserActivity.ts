import { db } from '~~/server/db';
import { sql } from 'drizzle-orm';
import { recordingsTable, usersTable } from '~~/database/schema';

export default defineTask({
  meta: {
    description: 'Log user activity for the past 15 minutes.',
  },
  async run() {
    await db.insert(recordingsTable).values({
      value: sql`(SELECT COUNT(*) FROM ${usersTable} WHERE ${usersTable.lastActivity} > NOW() - INTERVAL 15 MINUTE)`,
      recordType: 'user_count',
    });

    await useStorage('cache').removeItem(
      `statistics:userActivity:activity.json`
    );

    return {
      result: 'success',
    };
  },
});
