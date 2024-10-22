// server/plugins/queueWorker.ts
import { Worker } from 'bullmq';
import { db } from '~/server/db';
import { userTable } from '~/database/schema';
import { and, eq, lt, sql } from 'drizzle-orm';

export default defineNitroPlugin(() => {
  new Worker(
    'moneyQueue',
    async (job) => {
      const { userId } = job.data;
      await db
        .update(userTable)
        .set({
          money: sql`${userTable.money} + 1`,
        })
        .where(and(eq(userTable.id, userId), lt(userTable.money, 500)));
    },
    {
      connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
      },
    }
  );

  // You can log or handle worker events here if needed
  console.log('BullMQ worker started');
});
