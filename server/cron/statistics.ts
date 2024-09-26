import { defineCronHandler } from '#nuxt/cron';
import { db } from '~/server/db';
import { sql } from 'drizzle-orm';
import { recordings } from '~/database/schema';

export default defineCronHandler('everyThirtyMinutes', async () => {
  db.insert(recordings).values([
    { value: sql`SELECT COUNT(*) FROM hatchery`, record_type: 'total_dragons' },
    {
      value: sql`SELECT COUNT(DISTINCT(user_id)) FROM hatchery`,
      record_type: 'total_scrolls',
    },
  ]);
});
