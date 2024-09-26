import { getToken, getServerSession } from '#auth';
import { and, eq, inArray, notInArray } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';
import { hatchery, user } from '~/database/schema';
import { db } from '~/server/db';

async function fetchScroll(username: string, token: JWT) {
  return $fetch<
    DragCaveApiResponse<{ hasNextPage: boolean; endCursor: null | number }> & {
      dragons: Record<string, DragonData>;
    }
  >(`https://dragcave.net/api/v2/user?username=${username}&filter=GROWING`, {
    timeout: 10000,
    headers: {
      Authorization: `Bearer ${token.sessionToken}`,
    },
  });
}

async function syncScrollName(token: JWT) {
  const updated = await $fetch<
    DragCaveApiResponse<{
      username: string;
      user_id: number;
    }>
  >('https://dragcave.net/api/v2/me', {
    headers: {
      Authorization: `Bearer ${token.sessionToken}`,
    },
  });

  db.update(user)
    .set({ username: updated.data.username })
    .where(eq(user.id, token.userId));

  return updated.data;
}

export default defineEventHandler(async (event) => {
  const [token, session] = await Promise.all([
    getToken({ event }) as Promise<JWT>,
    getServerSession(event),
  ]);

  let scrollResponse = await fetchScroll(session?.user.username ?? '', token);

  if (scrollResponse.errors.find(([code]) => code === 4)) {
    // probably a disabled account
    return [];
  }

  if (scrollResponse.errors.find(([code]) => code === 3)) {
    // it's likely they've changed their username.
    const updated = await syncScrollName(token);
    scrollResponse = await fetchScroll(updated.username, token);
  }

  const scroll = Object.values(scrollResponse.dragons);
  const alive = scroll.filter((dragon) => dragon.hoursleft >= 0);

  if (alive.length) {
    await db.transaction(async (tx) => {
      // if a dragon that was in the hatchery has been moved to this scroll,
      // we should update its user id to reflect the change of ownership.
      await tx
        .update(hatchery)
        .set({ user_id: token?.userId })
        .where(
          inArray(
            hatchery.code,
            alive.map((dragon) => dragon.id)
          )
        );

      await tx.delete(hatchery).where(
        and(
          eq(hatchery.user_id, token?.userId),
          notInArray(
            hatchery.code,
            alive.map((dragon) => dragon.id)
          )
        )
      );
    });
  }

  const usersDragonsInHatchery = await db
    .select({
      code: hatchery.code,
      in_garden: hatchery.in_garden,
      in_seed_tray: hatchery.in_seed_tray,
    })
    .from(hatchery)
    .where(eq(hatchery.user_id, token?.userId));

  return alive.map<ScrollView>((dragon) => {
    const hatcheryDragon = usersDragonsInHatchery.find(
      (row) => row.code === dragon.id
    );

    return {
      ...dragon,
      in_garden: !!(hatcheryDragon?.in_garden ?? false),
      in_seed_tray: !!(hatcheryDragon?.in_seed_tray ?? false),
    };
  });
});
