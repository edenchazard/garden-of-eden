import { getToken } from '#auth';
import { and, eq } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';
import { caretakerTable, usersTable } from '~~/database/schema';
import { db } from '~~/server/db';

export default defineEventHandler(async (event) => {
  const token = (await getToken({ event })) as JWT;

  return db
    .select({ id: usersTable.id, username: usersTable.username })
    .from(caretakerTable)
    .innerJoin(usersTable, eq(caretakerTable.ownerId, usersTable.id))
    .where(
      and(
        eq(caretakerTable.userId, token.userId),
        eq(caretakerTable.approved, true),
        eq(caretakerTable.blocked, false)
      )
    );
});
