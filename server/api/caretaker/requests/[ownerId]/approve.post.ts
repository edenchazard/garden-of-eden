import { getToken } from '#auth';
import { and, eq } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';
import { caretakerTable } from '~~/database/schema';
import { db } from '~~/server/db';

export default defineEventHandler(async (event) => {
  const token = (await getToken({ event })) as JWT;
  const ownerIdParam = getRouterParam(event, 'ownerId');
  const ownerId = parseInt(ownerIdParam ?? '');

  if (!ownerId || isNaN(ownerId)) {
    setResponseStatus(event, 400, 'Bad Request');
    return 'Bad Request';
  }

  const result = await db
    .update(caretakerTable)
    .set({ approved: true })
    .where(
      and(
        eq(caretakerTable.userId, token.userId),
        eq(caretakerTable.ownerId, ownerId),
        eq(caretakerTable.blocked, false)
      )
    );

  if (result[0].affectedRows === 0) {
    setResponseStatus(event, 404, 'Not Found');
    return 'Not Found';
  }

  return sendNoContent(event);
});
