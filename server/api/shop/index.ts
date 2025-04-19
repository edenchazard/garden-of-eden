import {
  and,
  between,
  desc,
  eq,
  isNotNull,
  isNull,
  or,
  sql,
} from 'drizzle-orm';
import { itemsTable, purchasesTable } from '~/database/schema';
import { db } from '~/server/db';
import { getToken, getServerSession } from '#auth';
import type { JWT } from 'next-auth/jwt';

export default defineEventHandler(async (event) => {
  const token = (await getToken({ event })) as JWT;
  const session = await getServerSession(event);

  const getAvailableItems = db
    .select()
    .from(itemsTable)
    .where(
      and(
        isNotNull(itemsTable.cost),
        or(
          isNull(itemsTable.availableFrom),
          between(sql`NOW()`, itemsTable.availableFrom, itemsTable.availableTo)
        )
      )
    )
    .orderBy(itemsTable.name);

  const getCurrentFlair = async () => {
    if (!session?.user?.flair) return [null];

    return db
      .select({
        url: itemsTable.url,
        purchasedOn: purchasesTable.purchasedOn,
        name: itemsTable.name,
      })
      .from(purchasesTable)
      .innerJoin(itemsTable, eq(purchasesTable.itemId, itemsTable.id))
      .where(
        and(
          eq(purchasesTable.userId, token.userId),
          eq(purchasesTable.itemId, session?.user?.flair?.id)
        )
      )
      .orderBy(desc(purchasesTable.purchasedOn));
  };

  const [items, [currentFlair]] = await Promise.all([
    getAvailableItems,
    getCurrentFlair(),
  ]);

  return {
    currentFlair,
    regular: items.filter(
      (item) => item.category === 'flair' && item.availableFrom === null
    ),
    limited: items.filter(
      (item) => item.category === 'flair' && item.availableFrom !== null
    ),
    consumables: items.filter((item) => item.category === 'consumable'),
  };
});
