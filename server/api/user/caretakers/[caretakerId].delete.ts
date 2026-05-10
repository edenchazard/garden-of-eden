import { getToken } from '#auth';
import { and, eq } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';
import { z } from 'zod';
import { caretakerTable } from '~~/database/schema';
import { db } from '~~/server/db';

export default defineEventHandler(async (event) => {
  const schema = z.object({
    caretakerId: z.coerce.number(),
  });

  const [token, { caretakerId }] = await Promise.all([
    getToken({ event }) as Promise<JWT>,
    getValidatedRouterParams(event, schema.parse),
  ]);

  await db
    .delete(caretakerTable)
    .where(
      and(
        eq(caretakerTable.principalId, token.userId),
        eq(caretakerTable.caretakerId, caretakerId)
      )
    );

  return sendNoContent(event);
});
