import { Worker as BullWorker } from 'bullmq';
import { watch } from 'fs';
import { shareScrollQueue } from '~/server/queue';
import { db } from '~/server/db';
import { bannerJobsTable } from '~/database/schema';
import type {
  WorkerFinished,
  WorkerInput,
} from '~/workers/shareScrollWorkerTypes';

const {
  redis: { host, port },
} = useRuntimeConfig();

const round = (num: number | null) =>
  num !== null ? parseInt(num.toFixed(0)) : null;

export default defineNitroPlugin(async () => {
  const createWorker = () =>
    new BullWorker<WorkerInput, WorkerFinished>(
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
    .on('failed', async (job) => {
      if (!job) return;

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
    .on('completed', async (job) => {
      if (!job.returnvalue) {
        return;
      }

      console.log(
        'Bannergen job for user ',
        job.data.user,
        ' completed in ',
        round(job.returnvalue.performanceData.totalTime),
        'ms'
      );
      await db.insert(bannerJobsTable).values({
        userId: job.returnvalue.user.id,
        username: job.returnvalue.user.username,
        flairPath: job.returnvalue.user.flairPath,
        dragonsIncluded: job.returnvalue.performanceData.dragonsIncluded,
        dragonsOmitted: job.returnvalue.performanceData.dragonsOmitted,
        statGenTime: round(job.returnvalue.performanceData.statGenTime),
        dragonFetchTime: round(job.returnvalue.performanceData.dragonFetchTime),
        dragonGenTime: round(job.returnvalue.performanceData.dragonGenTime),
        frameGenTime: round(job.returnvalue.performanceData.frameGenTime),
        gifGenTime: round(job.returnvalue.performanceData.gifGenTime),
        totalTime: round(job.returnvalue.performanceData.totalTime),
      });
    });

  console.info('Banner worker queue started');
});
