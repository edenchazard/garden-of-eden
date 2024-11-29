import { getToken, getServerSession } from '#auth';
import { and, eq, gt, inArray, not, notInArray, sql } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';
import { clicksTable, hatcheryTable, userTable } from '~/database/schema';
import { db } from '~/server/db';
import { dragCaveFetch } from '~/server/utils/dragCaveFetch';
import { isIncubated, isStunned } from '~/utils/calculations';
import type { DragonData } from '~/types/DragonTypes';
import { phase } from '~/utils/dragons';

async function fetchScroll(username: string, token: JWT) {
  return dragCaveFetch()<
    DragCaveApiResponse<{ hasNextPage: boolean; endCursor: null | number }> & {
      dragons: Record<string, DragonData>;
    }
  >(`/user?username=${username}&filter=GROWING`, {
    headers: {
      Authorization: `Bearer ${token.sessionToken}`,
    },
  });
}

async function syncScrollName(token: JWT) {
  const updated = await dragCaveFetch()<
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

  if (scrollResponse.errors.find(([code]) => code === 3)) {
    // it's likely they've changed their username.
    const updated = await syncScrollName(token);
    scrollResponse = await fetchScroll(updated.username, token);
  }

  const scroll = Object.values(scrollResponse?.dragons ?? {});
  const alive = scroll
    .filter((dragon) => dragon.hoursleft >= 0)
    .map((dragon) => dragon.id);

  if (alive.length) {
    await db.transaction(async (tx) => {
      // if a dragon that was in the hatchery has been moved to this scroll,
      // we should update its user id to reflect the change of ownership.
      await tx
        .update(hatcheryTable)
        .set({ user_id: token.userId, is_incubated: false, is_stunned: false })
        .where(
          and(
            inArray(hatcheryTable.id, alive),
            not(eq(hatcheryTable.user_id, token.userId))
          )
        );

      await tx
        .delete(hatcheryTable)
        .where(
          and(
            eq(hatcheryTable.user_id, token.userId),
            notInArray(hatcheryTable.id, alive)
          )
        );
    });
  }

  const startOfToday = new Date();
  startOfToday.setDate(startOfToday.getDate() - 1);

  const [[{ clicks_today: clicksToday }], usersDragonsInHatchery] =
    await Promise.all([
      db
        .select({ clicks_today: sql<number>`COUNT(*)`.as('clicks_today') })
        .from(clicksTable)
        .where(
          and(
            inArray(clicksTable.hatchery_id, alive),
            gt(clicksTable.clicked_on, startOfToday)
          )
        ),
      db
        .select({
          id: hatcheryTable.id,
          in_garden: hatcheryTable.in_garden,
          in_seed_tray: hatcheryTable.in_seed_tray,
          is_incubated: hatcheryTable.is_incubated,
          is_stunned: hatcheryTable.is_stunned,
        })
        .from(hatcheryTable)
        .where(eq(hatcheryTable.user_id, token.userId)),
    ]);

  return {
    details: {
      clicksToday,
    },
    dragons: alive.map<ScrollView>((id) => {
      const apiDragon = scrollResponse.dragons[id];
      const hatcheryData = {
        in_garden: false,
        in_seed_tray: false,
        is_incubated: false,
        is_stunned: false,
        ...usersDragonsInHatchery.find((row) => row.id === id),
      };
      const stage = phase(apiDragon);
      const hatcheryDragon = {
        in_garden: hatcheryData.in_garden,
        in_seed_tray: hatcheryData.in_seed_tray,
        is_incubated:
          stage === 'Egg' &&
          (hatcheryData.is_incubated || isIncubated(apiDragon)),
        is_stunned:
          stage === 'Hatchling' &&
          (hatcheryData.is_stunned || isStunned(apiDragon)),
      };

      return {
        ...apiDragon,
        ...hatcheryDragon,
      };
    }),
  };
});
