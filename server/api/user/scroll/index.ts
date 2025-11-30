import { getToken, getServerSession } from '#auth';
import { and, desc, eq, gt, inArray, not, notInArray, sql } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';
import {
  clicksTable,
  hatcheryTable,
  userNotificationTable,
  usersTable,
} from '~~/database/schema';
import { db } from '~~/server/db';
import { dragCaveFetch } from '~~/server/utils/dragCaveFetch';
import { isIncubated, isStunned } from '~/utils/calculations';
import type { DragonData } from '#shared/DragonTypes';
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

  await db
    .update(usersTable)
    .set({ username: updated.data.username })
    .where(eq(usersTable.id, token.userId));

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
        .set({ userId: token.userId, isIncubated: false, isStunned: false })
        .where(
          and(
            inArray(hatcheryTable.id, alive),
            not(eq(hatcheryTable.userId, token.userId))
          )
        );

      await tx
        .delete(hatcheryTable)
        .where(
          and(
            eq(hatcheryTable.userId, token.userId),
            notInArray(hatcheryTable.id, alive)
          )
        );
    });
  }

  const startOfToday = new Date();
  startOfToday.setDate(startOfToday.getDate() - 1);

  const [[{ clicksToday }], usersDragonsInHatchery, [releaseNotification]] =
    await Promise.all([
      db
        .select({ clicksToday: sql<number>`COUNT(*)`.as('clicks_today') })
        .from(clicksTable)
        .where(
          and(
            inArray(clicksTable.hatcheryId, alive),
            gt(clicksTable.clickedOn, startOfToday)
          )
        ),
      db
        .select({
          id: hatcheryTable.id,
          inGarden: hatcheryTable.inGarden,
          inSeedTray: hatcheryTable.inSeedTray,
          isIncubated: hatcheryTable.isIncubated,
          isStunned: hatcheryTable.isStunned,
        })
        .from(hatcheryTable)
        .where(eq(hatcheryTable.userId, token.userId)),
      db
        .select({
          id: userNotificationTable.id,
          content: userNotificationTable.content,
          validUntil: userNotificationTable.validUntil,
        })
        .from(userNotificationTable)
        .where(
          and(
            eq(userNotificationTable.userId, token.userId),
            eq(userNotificationTable.type, 'dragcave')
          )
        )
        .orderBy(desc(userNotificationTable.createdAt))
        .limit(1),
    ]);

  return {
    releaseNotification,
    details: {
      clicksToday,
    },
    dragons: alive.map<ScrollView>((id) => {
      const apiDragon = scrollResponse.dragons[id];
      const hatcheryData = {
        inGarden: false,
        inSeedTray: false,
        isIncubated: false,
        isStunned: false,
        ...usersDragonsInHatchery.find((row) => row.id === id),
      };
      const stage = phase(apiDragon);
      const hatcheryDragon = {
        inGarden: hatcheryData.inGarden,
        inSeedTray: hatcheryData.inSeedTray,
        isIncubated:
          stage === 'Egg' &&
          (hatcheryData.isIncubated || isIncubated(apiDragon)),
        isStunned:
          stage === 'Hatchling' &&
          (hatcheryData.isStunned || isStunned(apiDragon)),
      };

      return {
        ...apiDragon,
        ...hatcheryDragon,
      };
    }),
  };
});
