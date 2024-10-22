import { db } from '~/server/db';
import { userTable } from '~/database/schema';
import { and, eq, lt, sql } from 'drizzle-orm';
import { Worker } from 'bullmq';

const worker = new Worker('moneyQueue', async (job) => {
  const { userId } = job.data;
  await db
    .update(userTable)
    .set({
      money: sql`${userTable.money} + 1`,
    })
    .where(and(eq(userTable.id, userId), lt(userTable.money, 500)));
});

export default worker;
