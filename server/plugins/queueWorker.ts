import { Worker as BullWorker } from 'bullmq';
import { db } from '~/server/db';
import { clicksTable, userTable } from '~/database/schema';
import { and, eq, lt, sql } from 'drizzle-orm';
import { spawn, Thread, Worker as ThreadsWorker } from 'threads';
import { promises as fs } from 'fs';
import { shareScrollQueue } from '~/server/queue';
import type { ShareScrollWorker } from '../queue/shareScrollWorker';

const {
  redis: { host, port },
  clientSecret,
} = useRuntimeConfig();

export default defineNitroPlugin(async () => {
  new BullWorker(
    'clickRecordQueue',
    async (job) => {
      const { userId, hatcheryId } = job.data;
      const [clickRecord] = await db.insert(clicksTable).ignore().values({
        hatchery_id: hatcheryId,
        user_id: userId,
      });

      if (clickRecord.affectedRows === 0) {
        return;
      }

      await db
        .update(userTable)
        .set({
          money: sql`${userTable.money} + 1`,
        })
        .where(and(eq(userTable.id, userId), lt(userTable.money, 500)));
    },
    {
      connection: {
        host,
        port: Number(port),
      },
    }
  );

  console.info('Click record worker started');

  await fs.mkdir('/cache/scroll', { recursive: true });

  const worker = await spawn<ShareScrollWorker>(
    new ThreadsWorker('./queue/shareScrollWorker.js', {
      _baseURL: import.meta.url,
      type: 'module',
    })
  );
  console.info('Share scroll worker started');

  new BullWorker(
    'shareScrollQueue',
    async (job) => {
      const { username, filePath } = job.data;
      console.log('received', username, filePath);

      try {
        // Get the worker instance

        console.log(worker);
        console.log('exposed');
        // Call the exposed function
        const result = await worker.processBanner(
          username,
          filePath,
          clientSecret
        );
        console.log('result');

        console.log('Result from worker:', result);

        if (result.type === 'error') {
          await shareScrollQueue.removeDeduplicationKey(
            `banner-${result.username}`
          );
        }
      } catch (error) {
        console.error('Worker error:', error);
      } finally {
        // await Thread.terminate(worker);
        console.log('dead');
      }
    },
    {
      connection: {
        host,
        port: Number(port),
      },
    }
  );

  console.info('Banner worker started');

  const terminateWorker = async () => {
    await Thread.terminate(worker);
    console.log('Worker terminated');
  };

  process.on('exit', terminateWorker);
  process.on('SIGINT', terminateWorker);
  process.on('SIGTERM', terminateWorker);
});
