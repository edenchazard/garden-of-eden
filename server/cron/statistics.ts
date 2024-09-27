import { defineCronHandler } from '#nuxt/cron';
import { db } from '~/server/db';
import { sql } from 'drizzle-orm';
import { recordingsTable } from '~/database/schema';

export default defineCronHandler('everyThirtyMinutes', async () => {
  await db.insert(recordingsTable).values([
    {
      value: sql`(SELECT COUNT(*) FROM hatchery)`,
      record_type: 'total_dragons',
    },
    {
      value: sql`(SELECT COUNT(DISTINCT(user_id)) FROM hatchery)`,
      record_type: 'total_scrolls',
    },
  ]);
});
