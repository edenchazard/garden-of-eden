import { getToken } from '#auth';
import { and, eq } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';
import { caretakerTable, usersTable } from '~~/database/schema';
import { db } from '~~/server/db';

export default defineEventHandler(async (event) => {
  const token = (await getToken({ event })) as JWT;

  return db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      approved: caretakerTable.approved,
    })
    .from(caretakerTable)
    .innerJoin(usersTable, eq(caretakerTable.userId, usersTable.id))
    .where(
      and(
        eq(caretakerTable.ownerId, token.userId),
        eq(caretakerTable.blocked, false)
      )
    );
});
