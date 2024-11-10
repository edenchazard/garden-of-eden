import { Worker as BullWorker } from 'bullmq';
import { watch } from 'fs';
import { shareScrollQueue } from '~/server/queue';
import { Worker } from 'worker_threads';

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
      console.log('MESSAGE FROM WORKER', message);

      if (message.type === 'error') {
        await shareScrollQueue.removeDeduplicationKey(
          `banner-${message.username}`
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
