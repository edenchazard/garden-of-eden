import { Worker as BullWorker } from 'bullmq';
import { watch } from 'fs';
import { shareScrollQueue } from '~/server/queue';
import { Worker } from 'worker_threads';
import { db } from '~/server/db';
import { bannerJobTable } from '~/database/schema';

const {
  redis: { host, port },
  clientSecret,
} = useRuntimeConfig();

export default defineNitroPlugin(async () => {
  const createWorker = () =>
    new Worker('./workers/shareScrollWorker.js', {
      workerData: { username: null, filePath: null },
    });

  let shareScrollWorker = createWorker();

  if (import.meta.dev) {
    watch('./workers/shareScrollWorker.js', () => {
      shareScrollWorker.terminate();
      shareScrollWorker = createWorker();
      console.info('Share scroll worker thread started');
    });
  }

  shareScrollWorker
    .on('message', async (message) => {
      if (message.type === 'jobFinished') {
        console.log('Job finished with stats: ', message.performanceData);
        // well, since an error can be ANYTHING, how can it be stored in db?
        // stringify the whole error, callstack and all?
        // or keep only the message string?
        await db.insert(bannerJobTable).values({
          user_id: message.user.id,
        });
      }

      if (message.type === 'error') {
        await shareScrollQueue.removeDeduplicationKey(
          `banner-` +
            message.filePath.substring(message.filePath.lastIndexOf('/') + 1)
        );
      }
    })
    .on('error', (message) => {
      console.log('error', message);
    });

  new BullWorker(
    'shareScrollQueue',
    async (job) => {
      const {
        user,
        filePath,
        weeklyClicks,
        weeklyRank,
        allTimeClicks,
        allTimeRank,
        dragons,
      } = job.data;

      console.log('received', user, filePath, dragons);

      shareScrollWorker.postMessage({
        type: 'banner',
        user,
        filePath,
        weeklyClicks,
        weeklyRank,
        allTimeClicks,
        allTimeRank,
        dragons,
        clientSecret,
      });
    },
    {
      connection: {
        host,
        port: Number(port),
      },
    }
  );

  console.info('Banner worker queue started');
});
