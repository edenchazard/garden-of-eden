import { getToken } from '#auth';
import { and, eq, gt, not } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';
import { z } from 'zod';
import { caretakerInviteTable, caretakerTable } from '~~/database/schema';
import { db } from '~~/server/db';

export default defineEventHandler(async (event) => {
  const schema = z.object({
    code: z.uuid(),
  });

  const [token, { code }] = await Promise.all([
    getToken({ event }) as Promise<JWT>,
    getValidatedRouterParams(event, schema.parse),
  ]);

  const [invite] = await db
    .select({
      principalId: caretakerInviteTable.principalId,
    })
    .from(caretakerInviteTable)
    .where(
      and(
        eq(caretakerInviteTable.code, code),
        gt(caretakerInviteTable.expiresAt, new Date()),
        not(eq(caretakerInviteTable.principalId, token.userId))
      )
    )
    .limit(1);

  if (!invite) {
    setResponseStatus(event, 404, 'Not Found');
    return null;
  }

  await db.transaction(async (tx) => {
    await tx.insert(caretakerTable).values({
      principalId: invite.principalId,
      caretakerId: token.userId,
    });

    await tx
      .delete(caretakerInviteTable)
      .where(eq(caretakerInviteTable.code, code));
  });

  return sendNoContent(event);
});
