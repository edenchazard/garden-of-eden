import { db } from '~/server/db';
import { getToken } from '#auth';
import { hatcheryTable, clicksTable } from '~/database/schema';
import type { JWT } from 'next-auth/jwt';
import { createSelectSchema } from 'drizzle-zod';
import { moneyQueue } from '~/server/queue/moneyQueue';

export default defineEventHandler(async (event) => {
  const schema = createSelectSchema(hatcheryTable).pick({
    id: true,
  });

  const [token, params] = await Promise.all([
    getToken({ event }) as Promise<JWT>,
    getValidatedRouterParams(event, schema.parse),
  ]);

  if (token) {
    await db.transaction(async (tx) => {
      const [clickRecord] = await tx.insert(clicksTable).ignore().values({
        hatchery_id: params.id,
        user_id: token.userId,
      });

      if (clickRecord.affectedRows === 0) {
        return;
      }

      await moneyQueue.add('updateMoney', { userId: token.userId });
    });
  }

  return sendRedirect(event, `https://dragcave.net/view/${params.id}`);
});
