import { Worker } from 'bullmq';
import { db } from '~/server/db';
import { clicksTable, userTable } from '~/database/schema';
import { and, eq, lt, sql } from 'drizzle-orm';

const {
  redis: { host, port },
} = useRuntimeConfig();

export default defineNitroPlugin(() => {
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
});
