import { getToken } from '#auth';
import { and, eq, gt, lt } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';
import { z } from 'zod';
import { caretakerInviteTable, caretakerTable } from '~~/database/schema';
import { db } from '~~/server/db';

export default defineEventHandler(async (event) => {
  const schema = z.object({
    code: z.uuid(),
  });

  const [token, { code }] = await Promise.all([
    getToken({ event }),
    getValidatedRouterParams(event, schema.parse),
  ]);

  if (!token) {
    setResponseStatus(event, 401, 'Unauthorized');
    return 'Unauthorized';
  }

  const authToken = token as JWT;

  const now = new Date();

  const [invite] = await db
    .select({
      ownerId: caretakerInviteTable.ownerId,
    })
    .from(caretakerInviteTable)
    .where(
      and(
        eq(caretakerInviteTable.code, code),
        gt(caretakerInviteTable.expiresAt, now)
      )
    )
    .limit(1);

  if (!invite || invite.ownerId === authToken.userId) {
    setResponseStatus(event, 404, 'Not Found');
    return 'Not Found';
  }

  await db.transaction(async (tx) => {
    await tx
      .insert(caretakerTable)
      .values({
        ownerId: invite.ownerId,
        userId: authToken.userId,
        approved: true,
        blocked: false,
      })
      .onDuplicateKeyUpdate({
        set: {
          approved: true,
          blocked: false,
        },
      });

    await tx
      .delete(caretakerInviteTable)
      .where(eq(caretakerInviteTable.ownerId, invite.ownerId));

    await tx
      .delete(caretakerInviteTable)
      .where(lt(caretakerInviteTable.expiresAt, now));
  });

  return sendNoContent(event);
});
