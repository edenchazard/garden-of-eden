import { db } from '~/server/db';
import { sql } from 'drizzle-orm';
import { recordingsTable, userTable } from '~/database/schema';

export default defineTask({
  meta: {
    description: 'Log user activity for the past 15 minutes.',
  },
  async run() {
    await db.insert(recordingsTable).values({
      value: sql`(SELECT COUNT(*) FROM ${userTable} WHERE ${userTable.last_activity} > NOW() - INTERVAL 15 MINUTE)`,
      record_type: 'user_count',
    });

    await useStorage('cache').removeItem(
      `statistics:userActivity:activity.json`
    );

    return {
      result: 'success',
    };
  },
});
