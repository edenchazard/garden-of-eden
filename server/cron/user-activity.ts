import { defineCronHandler } from '#nuxt/cron';
import { db } from '~/server/db';
import { sql } from 'drizzle-orm';
import { recordingsTable, userTable } from '~/database/schema';

export default defineCronHandler('everyFifteenMinutes', async () => {
  await db.insert(recordingsTable).values({
    value: sql`(SELECT COUNT(*) FROM ${userTable} WHERE ${userTable.last_activity} > NOW() - INTERVAL 15 MINUTE)`,
    record_type: 'user_count',
  });

  await useStorage('cache').removeItem(`statistics:userActivity:activity.json`);
});
