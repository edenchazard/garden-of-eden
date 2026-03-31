import { usersTable } from '~~/database/schema';
import { db } from '~~/server/db';
import type { DragonData } from '#shared/DragonTypes';
import { getToken, getServerSession } from '#auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { decrypt } from '~/utils/accessTokenHandling';
import type { JWT } from 'next-auth/jwt';

export default defineEventHandler(async (event) => {
  const { clientSecret, accessTokenPassword } = useRuntimeConfig();

  let username: string | null = null;
  let accessToken: string | null = null;
  let userId: number | null = null;

  const querySchema = z.object({
    userId: z.coerce.number().optional(),
    clientSecret: z.string().optional(),
  });

  const query = await querySchema.parseAsync(getQuery(event));

  if (query.userId && query.clientSecret) {
    if (query.clientSecret !== clientSecret) {
      return;
    }
    const [user] = await db
      .select({
        username: usersTable.username,
        accessToken: usersTable.accessToken,
      })
      .from(usersTable)
      .where(eq(usersTable.id, query.userId));
    if (!user.username || !user.accessToken) {
      return;
    }

    username = user.username;
    accessToken = decrypt(user.accessToken, accessTokenPassword);
    userId = query.userId;
  } else {
    const [t, s] = await Promise.all([
      getToken({ event }) as Promise<JWT>,
      getServerSession(event),
    ]);

    if (!t || !s) {
      return;
    }

    accessToken = t.sessionToken as string;
    username = s.user.username;
    userId = s.user.id;
  }

  // First, we'll grab a single dragon from the user with their private token.
  // That way, we know the dragon definitely exists.
  // We'll then test it again using the client secret.
  const privateResponse = await dragCaveFetch()<
    DragCaveApiResponse<{ hasNextPage: boolean; endCursor: null | number }> & {
      dragons: Record<string, DragonData>;
    }
  >('/user', {
    query: {
      username,
      limit: 1,
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const singleDragon = Object.keys(privateResponse?.dragons ?? {})[0];

  let blocked = false;

  if (singleDragon) {
    const publicResponse = await dragCaveFetch()<{
      errors: unknown[];
      dragons?: DragonData;
    }>(`/dragon/${singleDragon}`, {
      timeout: 20000,
      retry: 3,
      retryDelay: 1000 * 5,
      headers: {
        Authorization: `Bearer ${clientSecret}`,
      },
    });

    blocked = publicResponse.errors.length > 0;
  }

  await db
    .update(usersTable)
    .set({
      apiBlocked: blocked,
    })
    .where(eq(usersTable.id, userId));

  return blocked;
});
