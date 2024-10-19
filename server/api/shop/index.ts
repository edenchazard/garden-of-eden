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

  const [items, [currentFlair]] = await Promise.all([
    db
      .select()
      .from(itemsTable)
      .where(
        and(
          isNotNull(itemsTable.cost),
          or(
            isNull(itemsTable.availableFrom),
            between(
              sql`NOW()`,
              itemsTable.availableFrom,
              itemsTable.availableTo
            )
          )
        )
      )
      .orderBy(itemsTable.name),

    db
      .select({
        url: itemsTable.url,
        purchasedOn: purchasesTable.purchased_on,
        name: itemsTable.name,
      })
      .from(purchasesTable)
      .innerJoin(itemsTable, eq(purchasesTable.item_id, itemsTable.id))
      .where(
        and(
          eq(purchasesTable.user_id, token.userId),
          eq(purchasesTable.item_id, session?.user.flair?.id)
        )
      )
      .orderBy(desc(purchasesTable.purchased_on)),
  ]);

  return {
    currentFlair,
    regular: items.filter((item) => item.availableFrom === null),
    limited: items.filter((item) => item.availableFrom !== null),
  };
});
