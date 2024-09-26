import { desc, eq } from 'drizzle-orm';
import { recordings } from '~/database/schema';
import { db } from '~/server/db';

export default defineCachedEventHandler(
  async () => {
    const builder = db
      .select({
        recorded_on: recordings.recorded_on,
        value: recordings.value,
      })
      .from(recordings)
      .orderBy(recordings.recorded_on, desc(recordings.recorded_on))
      .limit(48);

    const [scrolls, dragons] = await Promise.all([
      builder.where(eq(recordings.record_type, 'total_scrolls')),
      builder.where(eq(recordings.record_type, 'total_dragons')),
    ]);

    // since we got them in descending order (latest 48),
    // we then have to reverse them for proper left-to-right display
    scrolls.reverse();
    dragons.reverse();

    return {
      scrolls,
      dragons,
    };
  },
  {
    maxAge: 60 * 5,
  }
);
