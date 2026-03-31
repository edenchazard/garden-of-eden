import { Worker as BullWorker } from 'bullmq';
import { db } from '~~/server/db';
import { clicksTable, usersTable } from '~~/database/schema';
import { and, eq, lt, sql } from 'drizzle-orm';

const {
  redis: { host, port },
} = useRuntimeConfig();

export default defineNitroPlugin(async () => {
  new BullWorker(
    'clickRecordQueue',
    async (job) => {
      const { userId, hatcheryId } = job.data;
      const [clickRecord] = await db.insert(clicksTable).ignore().values({
        hatcheryId: hatcheryId,
        userId: userId,
      });

      if (clickRecord.affectedRows === 0) {
        return;
      }

      await db
        .update(usersTable)
        .set({
          money: sql`${usersTable.money} + 1`,
        })
        .where(and(eq(usersTable.id, userId), lt(usersTable.money, 500)));
    },
    {
      connection: {
        host,
        port: Number(port),
      },
      concurrency: 10,
    }
  );

  console.info('Click record queue worker started');
});
