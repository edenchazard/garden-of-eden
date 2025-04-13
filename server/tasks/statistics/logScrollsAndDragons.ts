import { db } from '~/server/db';
import { sql } from 'drizzle-orm';
import { hatcheryTable, recordingsTable } from '~/database/schema';

export default defineTask({
  meta: {
    description: 'Log the number of dragons and scrolls in the hatchery.',
  },
  async run() {
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

    return {
      result: 'success',
    };
  },
});
