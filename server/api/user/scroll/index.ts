import { getToken, getServerSession } from '#auth';
import { and, between, eq, gt, inArray, notInArray, sql } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';
import { clicksTable, hatcheryTable, userTable } from '~/database/schema';
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

  db.update(userTable)
    .set({ username: updated.data.username })
    .where(eq(userTable.id, token.userId));

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
        .update(hatcheryTable)
        .set({ user_id: token.userId })
        .where(
          inArray(
            hatcheryTable.id,
            alive.map((dragon) => dragon.id)
          )
        );

      await tx.delete(hatcheryTable).where(
        and(
          eq(hatcheryTable.user_id, token.userId),
          notInArray(
            hatcheryTable.id,
            alive.map((dragon) => dragon.id)
          )
        )
      );
    });
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [[clicksToday], usersDragonsInHatchery] = await Promise.all([
    db
      .select({ clicks_today: sql<number>`COUNT(*)`.as('clicks_today') })
      .from(clicksTable)
      .where(
        and(
          inArray(
            clicksTable.hatchery_id,
            alive.map((dragon) => dragon.id)
          ),
          gt(clicksTable.clicked_on, startOfToday)
        )
      ),
    db
      .select({
        id: hatcheryTable.id,
        in_garden: hatcheryTable.in_garden,
        in_seed_tray: hatcheryTable.in_seed_tray,
      })
      .from(hatcheryTable)
      .where(eq(hatcheryTable.user_id, token.userId)),
  ]);

  return {
    details: clicksToday,
    dragons:
      alive.map<ScrollView>((dragon) => {
        const hatcheryDragon = usersDragonsInHatchery.find(
          (row) => row.id === dragon.id
        );

        return {
          ...dragon,
          in_garden: !!(hatcheryDragon?.in_garden ?? false),
          in_seed_tray: !!(hatcheryDragon?.in_seed_tray ?? false),
        };
      }) ?? [],
  };
});
