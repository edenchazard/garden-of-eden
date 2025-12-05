import { desc, eq } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';
import { itemsTable, userTrophyTable } from '~~/database/schema';
import { db } from '~~/server/db';
import { getToken } from '#auth';

export default defineEventHandler(async (event) => {
  const token = (await getToken({ event })) as JWT;

  const badges = await db
    .select({
      id: userTrophyTable.id,
      itemId: itemsTable.id,
      url: itemsTable.url,
      description: itemsTable.description,
      name: itemsTable.name,
      awardedOn: userTrophyTable.awardedOn,
      artist: itemsTable.artist,
      releaseDate: itemsTable.releaseDate,
    })
    .from(userTrophyTable)
    .innerJoin(itemsTable, eq(userTrophyTable.itemId, itemsTable.id))
    .where(eq(userTrophyTable.userId, token.userId))
    .orderBy(desc(userTrophyTable.awardedOn));

  return badges;
});
