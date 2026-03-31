import { getToken } from '#auth';
import { and, eq, inArray, not, notInArray } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';
import { z } from 'zod';
import { caretakerTable, usersTable } from '~~/database/schema';
import { db } from '~~/server/db';

export default defineEventHandler(async (event) => {
  const schema = z.object({
    usernames: z.array(z.string().max(32)).max(50),
  });

  const [token, { usernames }] = await Promise.all([
    getToken({ event }) as Promise<JWT>,
    readValidatedBody(event, schema.parse),
  ]);

  const uniqueUsernames = [
    ...new Set(usernames.map((u) => u.trim()).filter(Boolean)),
  ];

  if (uniqueUsernames.length === 0) {
    // Only delete non-blocked entries — blocked records persist permanently.
    await db
      .delete(caretakerTable)
      .where(
        and(
          eq(caretakerTable.ownerId, token.userId),
          eq(caretakerTable.blocked, false)
        )
      );
    return sendNoContent(event);
  }

  const resolvedUsers = await db
    .select({ id: usersTable.id, username: usersTable.username })
    .from(usersTable)
    .where(
      and(
        inArray(usersTable.username, uniqueUsernames),
        not(eq(usersTable.id, token.userId))
      )
    );

  const foundUsernames = new Set(
    resolvedUsers.map((u) => u.username.toLowerCase())
  );
  const invalidUsernames = uniqueUsernames.filter(
    (u) => !foundUsernames.has(u.toLowerCase())
  );

  if (invalidUsernames.length > 0) {
    setResponseStatus(event, 422);
    return { invalidUsernames };
  }

  const resolvedIds = resolvedUsers.map((u) => u.id);

  await db.transaction(async (tx) => {
    // Remove entries for users no longer in the list, but never touch blocked rows.
    await tx
      .delete(caretakerTable)
      .where(
        and(
          eq(caretakerTable.ownerId, token.userId),
          notInArray(caretakerTable.userId, resolvedIds),
          eq(caretakerTable.blocked, false)
        )
      );

    // INSERT IGNORE: leaves existing approved/pending/blocked rows untouched.
    await tx
      .insert(caretakerTable)
      .ignore()
      .values(
        resolvedUsers.map((u) => ({
          userId: u.id,
          ownerId: token.userId,
        }))
      );
  });

  return sendNoContent(event);
});
