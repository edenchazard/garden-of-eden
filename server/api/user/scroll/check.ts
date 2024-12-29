import { userTable } from '~/database/schema';
import { db } from '~/server/db';
import type { DragonData } from '~/types/DragonTypes';
import { getToken, getServerSession } from '#auth';
import type { JWT } from 'next-auth/jwt';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const { clientSecret } = useRuntimeConfig();
  const [token, session] = await Promise.all([
    getToken({ event }) as Promise<JWT>,
    getServerSession(event),
  ]);

  // First, we'll grab a single dragon from the user with their private token.
  // That way, we know the dragon definitely exists.
  // We'll then test it again using the client secret.
  const privateResponse = await dragCaveFetch()<
    DragCaveApiResponse<{ hasNextPage: boolean; endCursor: null | number }> & {
      dragons: Record<string, DragonData>;
    }
  >('/user', {
    query: {
      username: session?.user.username,
      limit: 1,
    },
    headers: {
      Authorization: `Bearer ${token.sessionToken}`,
    },
  });

  const singleDragon = Object.keys(privateResponse?.dragons ?? {})[0];

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

  if (publicResponse.errors.length) {
    return true;
  }

  // We can reset now.
  await db
    .update(userTable)
    .set({
      apiBlocked: false,
    })
    .where(eq(userTable.id, token.userId));
  return false;
});
