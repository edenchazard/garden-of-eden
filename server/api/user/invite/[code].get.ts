import { and, eq, exists, gt, not } from 'drizzle-orm';
import { z } from 'zod';
import {
  caretakerInviteTable,
  caretakerTable,
  usersTable,
} from '~~/database/schema';
import { db } from '~~/server/db';
import type { JWT } from 'next-auth/jwt';
import { getToken } from '#auth';

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
      id: caretakerInviteTable.principalId,
      username: usersTable.username,
      expiresAt: caretakerInviteTable.expiresAt,
    })
    .from(caretakerInviteTable)
    .innerJoin(usersTable, eq(caretakerInviteTable.principalId, usersTable.id))
    .where(
      and(
        eq(caretakerInviteTable.code, code),
        gt(caretakerInviteTable.expiresAt, new Date()),
        not(
          exists(
            db
              .select()
              .from(caretakerTable)
              .where(
                and(
                  eq(
                    caretakerTable.principalId,
                    caretakerInviteTable.principalId
                  ),
                  eq(caretakerTable.caretakerId, token.userId)
                )
              )
          )
        )
      )
    )
    .limit(1);

  if (!invite) {
    setResponseStatus(event, 404, 'Not Found');
    return null;
  }

  return invite;
});
