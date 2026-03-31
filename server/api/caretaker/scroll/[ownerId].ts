import { getToken } from '#auth';
import { and, eq } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';
import { caretakerTable, hatcheryTable, usersTable } from '~~/database/schema';
import { db } from '~~/server/db';
import { dragCaveFetch } from '~~/server/utils/dragCaveFetch';
import { decrypt } from '~/utils/accessTokenHandling';
import { isIncubated, isStunned } from '~/utils/calculations';
import type { DragonData } from '#shared/DragonTypes';
import { phase } from '~/utils/dragons';

export default defineEventHandler(async (event) => {
  const token = (await getToken({ event })) as JWT;
  const ownerIdParam = getRouterParam(event, 'ownerId');
  const ownerId = parseInt(ownerIdParam ?? '');

  if (!ownerId || isNaN(ownerId)) {
    setResponseStatus(event, 400, 'Bad Request');
    return 'Bad Request';
  }

  const { accessTokenPassword } = useRuntimeConfig();

  const [caretakerEntry] = await db
    .select()
    .from(caretakerTable)
    .where(
      and(
        eq(caretakerTable.userId, token.userId),
        eq(caretakerTable.ownerId, ownerId),
        eq(caretakerTable.approved, true),
        eq(caretakerTable.blocked, false)
      )
    )
    .limit(1);

  if (!caretakerEntry) {
    setResponseStatus(event, 403, 'Forbidden');
    return 'Forbidden';
  }

  const [owner] = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      accessToken: usersTable.accessToken,
    })
    .from(usersTable)
    .where(eq(usersTable.id, ownerId))
    .limit(1);

  if (!owner?.accessToken) {
    setResponseStatus(event, 503, 'Owner has no stored access token');
    return 'Owner has no stored access token';
  }

  const decryptedToken = decrypt(owner.accessToken, accessTokenPassword);

  const scrollResponse = await dragCaveFetch()<
    DragCaveApiResponse<{ hasNextPage: boolean; endCursor: null | number }> & {
      dragons: Record<string, DragonData>;
    }
  >(`/user?username=${encodeURIComponent(owner.username)}&filter=GROWING`, {
    headers: {
      Authorization: `Bearer ${decryptedToken}`,
    },
  });

  const alive = Object.values(scrollResponse?.dragons ?? {})
    .filter((dragon) => dragon.hoursleft >= 0)
    .map((dragon) => dragon.id);

  const ownersDragonsInHatchery =
    alive.length > 0
      ? await db
          .select({
            id: hatcheryTable.id,
            inGarden: hatcheryTable.inGarden,
            inSeedTray: hatcheryTable.inSeedTray,
            isIncubated: hatcheryTable.isIncubated,
            isStunned: hatcheryTable.isStunned,
          })
          .from(hatcheryTable)
          .where(eq(hatcheryTable.userId, ownerId))
      : [];

  return {
    releaseNotification: null,
    details: { clicksToday: 0 },
    dragons: alive.map<ScrollView>((id) => {
      const apiDragon = scrollResponse.dragons[id];
      const hatcheryData = {
        inGarden: false,
        inSeedTray: false,
        isIncubated: false,
        isStunned: false,
        ...ownersDragonsInHatchery.find((row) => row.id === id),
      };
      const stage = phase(apiDragon);
      return {
        ...apiDragon,
        inGarden: hatcheryData.inGarden,
        inSeedTray: hatcheryData.inSeedTray,
        isIncubated:
          stage === 'Egg' &&
          (hatcheryData.isIncubated || isIncubated(apiDragon)),
        isStunned:
          stage === 'Hatchling' &&
          (hatcheryData.isStunned || isStunned(apiDragon)),
      };
    }),
  };
});
