import { desc, eq } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';
import { itemsTable, userTrophiesTable } from '~/database/schema';
import { db } from '~/server/db';
import { getToken } from '#auth';

export default defineEventHandler(async (event) => {
  const token = (await getToken({ event })) as JWT;

  const badges = await db
    .select({
      id: userTrophiesTable.id,
      itemId: itemsTable.id,
      url: itemsTable.url,
      description: itemsTable.description,
      name: itemsTable.name,
      awardedOn: userTrophiesTable.awardedOn,
      artist: itemsTable.artist,
    })
    .from(userTrophiesTable)
    .innerJoin(itemsTable, eq(userTrophiesTable.itemId, itemsTable.id))
    .where(eq(userTrophiesTable.userId, token.userId))
    .orderBy(desc(userTrophiesTable.awardedOn));

  return badges;
});
