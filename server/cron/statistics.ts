import { defineCronHandler } from '#nuxt/cron';
import { db } from '~/server/db';
import { sql } from 'drizzle-orm';
import { hatcheryTable, recordingsTable } from '~/database/schema';

export default defineCronHandler('everyThirtyMinutes', async () => {
  await db.insert(recordingsTable).values([
    {
      value: sql`(SELECT COUNT(*) FROM ${hatcheryTable})`,
      record_type: 'total_dragons',
    },
    {
      value: sql`(SELECT COUNT(DISTINCT(${hatcheryTable.user_id})) FROM ${hatcheryTable})`,
      record_type: 'total_scrolls',
    },
  ]);

  // Clear totals.
  await Promise.all([
    useStorage('cache').removeItem('statistics:hatcheryTotals:dragons.json'),
    useStorage('cache').removeItem('statistics:hatcheryTotals:scrolls.json'),
  ]);
});
