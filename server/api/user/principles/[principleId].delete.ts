import { getToken } from '#auth';
import { and, eq } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';
import { z } from 'zod';
import { caretakerTable } from '~~/database/schema';
import { db } from '~~/server/db';

export default defineEventHandler(async (event) => {
  const schema = z.object({
    principleId: z.coerce.number(),
  });

  const [token, { principleId }] = await Promise.all([
    getToken({ event }) as Promise<JWT>,
    getValidatedRouterParams(event, schema.parse),
  ]);

  await db
    .delete(caretakerTable)
    .where(
      and(
        eq(caretakerTable.principleId, principleId),
        eq(caretakerTable.caretakerId, token.userId)
      )
    );

  return sendNoContent(event);
});
