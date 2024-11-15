import { Worker as BullWorker, type Job } from 'bullmq';
import { watch } from 'fs';
import { shareScrollQueue } from '~/server/queue';
// import { Worker } from 'worker_threads';
import { db } from '~/server/db';
import { bannerJobsTable } from '~/database/schema';
import type {
  WorkerInput,
  // WorkerFinished,
  // WorkerResponse,
  // WorkerError,
  // since i'm not using these, should they be removed from the types file too?
} from '~/workers/shareScrollWorkerTypes';

const {
  redis: { host, port },
} = useRuntimeConfig();

const round = (num: number | null) =>
  num !== null ? parseInt(num.toFixed(0)) : null;

// function isJobFinished(message: WorkerResponse): message is WorkerFinished {
//   return message.type === 'jobFinished';
// }

// function isJobError(message: WorkerResponse): message is WorkerError {
//   return message.type === 'error';
// }

// i ended up not using these but should i?

export default defineNitroPlugin(async () => {
  const createWorker = () =>
    new BullWorker<WorkerInput>(
      'shareScrollQueue',
      '/src/workers/shareScrollWorker.js',
      {
        useWorkerThreads: true,
        connection: {
          host,
          port: Number(port),
        },
      }
    );

  let shareScrollWorker = createWorker();

  if (import.meta.dev) {
    watch('/src/workers/shareScrollWorker.js', () => {
      shareScrollWorker.close();
      shareScrollWorker = createWorker();
      console.info('shareScrollWorker thread started');
    });
  }

  shareScrollWorker
    .on('failed', async (job: Job) => {
      // currently, failures not occurring in bannergen, where failures
      // are always caught and recorded in the perfdata error field,
      // end up in this block and not recorded in the db.
      // this includes api failures.
      // should ALL failures be inserted to db anyway?
      console.error(`Bannergen job failed: `, job.failedReason);
      console.error(job.stacktrace.join('\n'));
      await shareScrollQueue.removeDeduplicationKey(
        `banner-` +
          job.data.filePath.substring(job.data.filePath.lastIndexOf('/') + 1)
      );
    })
    .on('completed', async (job: Job) => {
      if (job.returnvalue) {
        console.log(
          'Bannergen job for user ',
          job.data.user,
          ' completed in ',
          round(job.returnvalue.totalTime),
          'ms'
        );
        await db.insert(bannerJobsTable).values({
          userId: job.returnvalue.id,
          username: job.returnvalue.username,
          flairPath: job.returnvalue.flairUrl,
          dragonsIncluded: job.returnvalue.dragonsIncluded,
          dragonsOmitted: job.returnvalue.dragonsOmitted,
          statGenTime: round(job.returnvalue.statGenTime),
          dragonFetchTime: round(job.returnvalue.dragonFetchTime),
          dragonGenTime: round(job.returnvalue.dragonGenTime),
          frameGenTime: round(job.returnvalue.frameGenTime),
          gifGenTime: round(job.returnvalue.gifGenTime),
          totalTime: round(job.returnvalue.totalTime),
        });
      }
      return;
    });

  console.info('Banner worker queue started');
});
