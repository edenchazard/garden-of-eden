import { getToken } from '#auth';
import { and, eq } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';
import { caretakerTable, usersTable } from '~~/database/schema';
import { db } from '~~/server/db';

export default defineEventHandler(async (event) => {
  const token = (await getToken({ event })) as JWT;

  return await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
    })
    .from(caretakerTable)
    .innerJoin(usersTable, eq(caretakerTable.caretakerId, usersTable.id))
    .where(and(eq(caretakerTable.principleId, token.userId)));
});
