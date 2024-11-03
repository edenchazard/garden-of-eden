import { defineCronHandler } from '#nuxt/cron';
import { recordingsTable } from '~/database/schema';
import { db } from '../db';
import { DateTime } from 'luxon';
import { purgeCounters } from '../utils/dragCaveFetch';

export default defineCronHandler('everyFiveMinutes', async () => {
  const { failure, success } = getCounters();

  const now = DateTime.now().startOf('minute').toMillis();
  const successful = success.filter((timestamp) => timestamp < now);
  const failed = failure.filter((timestamp) => timestamp < now);

  await db.insert(recordingsTable).values({
    recorded_on: DateTime.now()
      .startOf('minute')
      .toSQL({ includeOffset: false }),
    value: successful.length + failed.length,
    record_type: 'api_request',
    extra: {
      success: successful.length,
      failure: failed.length,
    },
  });

  purgeCounters(now);
  await useStorage('cache').removeItem('statistics:api:requests.json');
});
