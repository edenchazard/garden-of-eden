import { Worker as BullWorker } from 'bullmq';
import { watch } from 'fs';
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

      console.error(`Bannergen job failed: `, job.failedReason);
      console.error(job.stacktrace.join('\n'));

      await db.insert(bannerJobsTable).values({
        userId: job.data.user.id,
        username: job.data.user.username,
        flairPath: job.data.user.flairPath,
        dragonsIncluded: job.data.dragons,
        error: job.failedReason,
      });
    })
    .on('completed', async (job) => {
      if (!job.returnvalue) {
        return;
      }

      console.log(
        'Bannergen job ',
        job.data,
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
        error: JSON.stringify(job.returnvalue.performanceData.error),
      });
    });

  console.info('Banner worker queue started');
});
