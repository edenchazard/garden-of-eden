import { and, eq, gt } from 'drizzle-orm';
import { z } from 'zod';
import { caretakerInviteTable, usersTable } from '~~/database/schema';
import { db } from '~~/server/db';

export default defineEventHandler(async (event) => {
  const schema = z.object({
    code: z.uuid(),
  });

  const { code } = await getValidatedRouterParams(event, schema.parse);
  const now = new Date();

  const [invite] = await db
    .select({
      ownerId: caretakerInviteTable.ownerId,
      ownerUsername: usersTable.username,
      expiresAt: caretakerInviteTable.expiresAt,
    })
    .from(caretakerInviteTable)
    .innerJoin(usersTable, eq(caretakerInviteTable.ownerId, usersTable.id))
    .where(
      and(
        eq(caretakerInviteTable.code, code),
        gt(caretakerInviteTable.expiresAt, now)
      )
    )
    .limit(1);

  if (!invite) {
    setResponseStatus(event, 404, 'Not Found');
    return 'Not Found';
  }

  return invite;
});
