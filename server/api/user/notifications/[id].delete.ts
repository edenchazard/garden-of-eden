import { userNotificationsTable } from '~/database/schema';
import { db } from '~/server/db';
import { getToken } from '#auth';
import type { JWT } from 'next-auth/jwt';
import { and, eq } from 'drizzle-orm';

import { z } from 'zod';

export default defineEventHandler(async (event) => {
  const schema = z.object({
    id: z.coerce.number(),
  });

  const [token, params] = await Promise.all([
    getToken({ event }) as Promise<JWT>,
    getValidatedRouterParams(event, schema.parse),
  ]);

  await db
    .delete(userNotificationsTable)
    .where(
      and(
        eq(userNotificationsTable.id, params.id),
        eq(userNotificationsTable.userId, token.userId)
      )
    );

  setResponseStatus(event, 204);
});
