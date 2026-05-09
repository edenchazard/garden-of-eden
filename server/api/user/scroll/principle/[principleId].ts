import { eq } from 'drizzle-orm';
import { hatcheryTable, usersTable } from '~~/database/schema';
import { db } from '~~/server/db';
import { dragCaveFetch } from '~~/server/utils/dragCaveFetch';
import { decrypt } from '~/utils/accessTokenHandling';
import { isIncubated, isStunned } from '~/utils/calculations';
import type { DragonData } from '#shared/DragonTypes';
import { phase } from '~/utils/dragons';
import z from 'zod';

export default defineEventHandler(async (event) => {
  const schema = z.object({
    principleId: z.coerce.number(),
  });

  const { principleId } = await getValidatedRouterParams(event, schema.parse);

  const [user] = await db
    .select({
      accessToken: usersTable.accessToken,
      username: usersTable.username,
    })
    .from(usersTable)
    .where(eq(usersTable.id, principleId));

  if (!user?.accessToken) {
    setResponseStatus(event, 404, 'Access token or user unavailable.');
    return null;
  }

  const decryptedToken = decrypt(
    user.accessToken,
    useRuntimeConfig().accessTokenPassword
  );

  const scrollResponse = await dragCaveFetch()<
    DragCaveApiResponse<{ hasNextPage: boolean; endCursor: null | number }> & {
      dragons: Record<string, DragonData>;
    }
  >(`/user?username=${encodeURIComponent(user.username)}&filter=GROWING`, {
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
          .where(eq(hatcheryTable.userId, principleId))
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
