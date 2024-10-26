import { Worker } from 'bullmq';
import { db } from '~/server/db';
import { clicksTable, userTable } from '~/database/schema';
import { and, eq, lt, sql } from 'drizzle-orm';
import { Worker as workerThreads } from 'worker_threads';
import { promises as fs } from 'fs';
import { shareScrollQueue } from '~/server/queue';

const {
  redis: { host, port },
  clientSecret,
} = useRuntimeConfig();

export default defineNitroPlugin(async () => {
  new Worker(
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

  const shareScrollWorker = new workerThreads(
    '/src/server/queue/shareScrollWorker.ts',
    {
      execArgv: ['-r', 'tsx'],
      workerData: { username: null, filePath: null },
    }
  );

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

  new Worker(
    'shareScrollQueue',
    async (job) => {
      const { username, filePath } = job.data;
      console.log('received', username, filePath);

      shareScrollWorker.postMessage({
        type: 'banner',
        username,
        filePath,
        // TODO: change to user oauth token
        token: clientSecret,
      });
    },
    {
      connection: {
        host,
        port: Number(port),
      },
    }
  );

  console.info('Banner worker started');
});
