import { Worker as BullWorker } from 'bullmq';
import { promises as fs, watch } from 'fs';
import { shareScrollQueue } from '~/server/queue';
import { Worker } from 'worker_threads';

const {
  redis: { host, port },
  clientSecret,
} = useRuntimeConfig();

export default defineNitroPlugin(async () => {
  await fs.mkdir('/cache/scroll', { recursive: true });

  const createWorker = () =>
    new Worker('./server/workers/shareScrollWorker.js', {
      workerData: { username: null, filePath: null },
    });

  let shareScrollWorker = createWorker();

  watch('./server/workers/shareScrollWorker.js', () => {
    shareScrollWorker.terminate();
    shareScrollWorker = createWorker();
    console.info('Share scroll worker thread started');
  });

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
        username,
        filePath,
        weeklyClicks,
        weeklyRank,
        allTimeClicks,
        allTimeRank,
        dragonCodes,
        flairUrl,
      } = job.data;

      console.log('received', username, filePath, 'codes', dragonCodes);

      shareScrollWorker.postMessage({
        type: 'banner',
        username,
        filePath,
        weeklyClicks,
        weeklyRank,
        allTimeClicks,
        allTimeRank,
        dragonCodes,
        flairUrl,
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
