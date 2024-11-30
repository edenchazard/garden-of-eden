import { Worker as BullWorker } from 'bullmq';
import { watch } from 'fs';
import { db } from '~/server/db';
import { bannerJobsTable, userTable } from '~/database/schema';
import type {
  WorkerFinished,
  WorkerInput,
} from '~/workers/shareScrollWorkerTypes';
import { eq } from 'drizzle-orm';
import { pathToFileURL } from 'url';

const {
  redis: { host, port },
} = useRuntimeConfig();

const round = (num: number | null) =>
  num !== null ? parseInt(num.toFixed(0)) : null;

export default defineNitroPlugin(async () => {
  const createWorker = () =>
    new BullWorker<WorkerInput, WorkerFinished>(
      'shareScrollQueue',
      pathToFileURL('./workers/shareScroll.worker.cjs'),
      {
        useWorkerThreads: true,
        connection: {
          host,
          port: Number(port),
        },
        concurrency: 10,
      }
    );

  let shareScrollWorker = createWorker();

  if (import.meta.dev) {
    watch('./workers/shareScroll.worker.cjs', () => {
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

      await db.transaction(async (tx) => {
        const promises: Promise<unknown>[] = [
          tx.insert(bannerJobsTable).values({
            userId: job.data.user.id,
            username: job.data.user.username,
            flairPath: job.data.user.flairPath,
            dragonsIncluded: job.data.dragons,
            error: job.failedReason,
            requestParams: job.data.requestParameters,
          }),
        ];

        if (job.failedReason.endsWith('401 Unauthorized')) {
          promises.push(
            tx
              .update(userTable)
              .set({ accessToken: null })
              .where(eq(userTable.id, job.data.user.id))
          );
        }

        await Promise.all(promises);
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
        userId: job.data.user.id,
        username: job.data.user.username,
        flairPath: job.data.user.flairPath,
        dragonsIncluded: job.returnvalue.performanceData.dragonsIncluded,
        dragonsOmitted: job.returnvalue.performanceData.dragonsOmitted,
        statGenTime: round(job.returnvalue.performanceData.statGenTime),
        dragonFetchTime: round(job.returnvalue.performanceData.dragonFetchTime),
        dragonGenTime: round(job.returnvalue.performanceData.dragonGenTime),
        frameGenTime: round(job.returnvalue.performanceData.frameGenTime),
        gifGenTime: round(job.returnvalue.performanceData.gifGenTime),
        totalTime: round(job.returnvalue.performanceData.totalTime),
        error: JSON.stringify(job.returnvalue.performanceData.error),
        requestParams: job.data.requestParameters,
      });
    });

  console.info('Banner worker queue started');
});
