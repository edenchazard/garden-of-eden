import {
  and,
  between,
  desc,
  eq,
  gte,
  isNotNull,
  isNull,
  or,
  sql,
} from 'drizzle-orm';
import { itemsTable, purchasesTable } from '~/database/schema';
import { db } from '~/server/db';
import { getToken, getServerSession } from '#auth';
import type { JWT } from 'next-auth/jwt';
import { DateTime } from 'luxon';

export default defineEventHandler(async (event) => {
  const token = (await getToken({ event })) as JWT;
  const session = await getServerSession(event);

  const [items, [currentFlair], tickets] = await Promise.all([
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

    db
      .select({
        url: itemsTable.url,
        name: itemsTable.name,
        expiry: purchasesTable.expiry,
        description: itemsTable.description,
      })
      .from(purchasesTable)
      .innerJoin(
        itemsTable,
        and(
          eq(purchasesTable.item_id, itemsTable.id),
          gte(
            purchasesTable.expiry,
            DateTime.now().minus({ weeks: 1 }).toJSDate()
          )
        )
      )
      .where(and(eq(itemsTable.category, 'ticket'))),
  ]);

  return {
    currentFlair,
    regular: items.filter((item) => item.availableFrom === null),
    limited: items.filter((item) => item.availableFrom !== null),
    tickets,
  };
});
