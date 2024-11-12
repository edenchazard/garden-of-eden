import { Worker as BullWorker } from 'bullmq';
import { watch } from 'fs';
import { shareScrollQueue } from '~/server/queue';
import { Worker } from 'worker_threads';
import { db } from '~/server/db';
import { bannerJobsTable } from '~/database/schema';
import type {
  WorkerInput,
  WorkerFinished,
  WorkerResponse,
  WorkerError,
} from '~/workers/shareScrollWorkerTypes';

const {
  redis: { host, port },
  clientSecret,
} = useRuntimeConfig();

const round = (num: number | null) =>
  num !== null ? parseInt(num.toFixed(0)) : null;

function isJobFinished(message: WorkerResponse): message is WorkerFinished {
  return message.type === 'jobFinished';
}

function isJobError(message: WorkerResponse): message is WorkerError {
  return message.type === 'error';
}

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
    .on('message', async (message: WorkerResponse) => {
      if (isJobFinished(message)) {
        console.log('Job finished with stats: ', message.performanceData);

        await db.insert(bannerJobsTable).values({
          userId: message.user.id,
          username: message.user.username,
          flairPath: message.user.flairPath,
          dragonsIncluded: message.performanceData.dragonsIncluded,
          dragonsOmitted: message.performanceData.dragonsOmitted,
          statGenTime: round(message.performanceData.statGenTime),
          dragonFetchTime: round(message.performanceData.dragonFetchTime),
          dragonGenTime: round(message.performanceData.dragonGenTime),
          frameGenTime: round(message.performanceData.frameGenTime),
          gifGenTime: round(message.performanceData.gifGenTime),
          totalTime: round(message.performanceData.totalTime),
          // since an error can be anything, how can it be stored in db?
          // stringify the whole error, callstack and all?
          // or keep only the message string?
        });
        return;
      }

      if (isJobError(message)) {
        await shareScrollQueue.removeDeduplicationKey(
          `banner-` +
            message.filePath.substring(message.filePath.lastIndexOf('/') + 1)
        );
      }
    })
    .on('error', (message) => {
      console.log('error', message);
    });

  new BullWorker<WorkerInput>(
    'shareScrollQueue',
    async (job) => {
      console.log('received', job.data);

      shareScrollWorker.postMessage({
        ...job.data,
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
