import { getToken } from '#auth';
import { eq } from 'drizzle-orm';
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
    .innerJoin(usersTable, eq(caretakerTable.principleId, usersTable.id))
    .where(eq(caretakerTable.caretakerId, token.userId));
});
