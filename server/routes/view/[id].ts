import { db } from '~/server/db';
import { getToken } from '#auth';
import { hatcheryTable, clicksTable, userTable } from '~/database/schema';
import type { JWT } from 'next-auth/jwt';
import { createSelectSchema } from 'drizzle-zod';
import { and, eq, lt, sql } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const schema = createSelectSchema(hatcheryTable).pick({
    id: true,
  });

  const [token, params] = await Promise.all([
    getToken({ event }) as Promise<JWT>,
    getValidatedRouterParams(event, schema.parse),
  ]);

  if (token) {
    const [clickRecord] = await db.insert(clicksTable).ignore().values({
      hatchery_id: params.id,
      user_id: token.userId,
    });

    if (clickRecord.affectedRows === 0) {
      return;
    }

    await db
      .update(userTable)
      .set({
        money: sql`${userTable.money} + 1`,
      })
      .where(and(eq(userTable.id, token.userId), lt(userTable.money, 500)));
  }

  return sendRedirect(event, `https://dragcave.net/view/${params.id}`);
});
