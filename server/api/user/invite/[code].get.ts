import { and, eq, gt } from 'drizzle-orm';
import { z } from 'zod';
import { caretakerInviteTable, usersTable } from '~~/database/schema';
import { db } from '~~/server/db';

export default defineEventHandler(async (event) => {
  const schema = z.object({
    code: z.uuid(),
  });

  const { code } = await getValidatedRouterParams(event, schema.parse);

  const [invite] = await db
    .select({
      id: caretakerInviteTable.principleId,
      username: usersTable.username,
      expiresAt: caretakerInviteTable.expiresAt,
    })
    .from(caretakerInviteTable)
    .innerJoin(usersTable, eq(caretakerInviteTable.principleId, usersTable.id))
    .where(
      and(
        eq(caretakerInviteTable.code, code),
        gt(caretakerInviteTable.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!invite) {
    setResponseStatus(event, 404, 'Not Found');
    return null;
  }

  return invite;
});
