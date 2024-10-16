import { and, eq, isNull } from 'drizzle-orm';
import { itemsTable } from '~/database/schema';
import { db } from '~/server/db';

export default defineEventHandler(async (event) => {
  const items = await db
    .select({
      id: itemsTable.id,
      name: itemsTable.name,
      url: itemsTable.url,
      cost: itemsTable.cost,
    })
    .from(itemsTable)
    .where(
      and(
        eq(itemsTable.category, 'flair'),
        isNull(itemsTable.availableFrom),
        isNull(itemsTable.cost)
      )
    )
    .orderBy(itemsTable.name);

  return items;
});
