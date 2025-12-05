import { recordingsTable } from '~~/database/schema';
import { db } from '~~/server/db';
import { DateTime } from 'luxon';
import { purgeCounters } from '~~/server/utils/dragCaveFetch';

export default defineTask({
  meta: {
    description: 'Log API request counts. Resets after updating.',
  },
  async run() {
    const { failure, success } = getCounters();

    const now = DateTime.now().startOf('minute').toMillis();
    const successful = success.filter((timestamp) => timestamp < now);
    const failed = failure.filter((timestamp) => timestamp < now);

    await db.insert(recordingsTable).values({
      recordedOn: DateTime.now()
        .startOf('minute')
        .toSQL({ includeOffset: false }),
      value: successful.length + failed.length,
      recordType: 'api_request',
      extra: {
        success: successful.length,
        failure: failed.length,
      },
    });

    purgeCounters(now);
    await useStorage('cache').removeItem('statistics:api:requests.json');
    return {
      result: 'success',
    };
  },
});
