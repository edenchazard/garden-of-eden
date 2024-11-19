import { db } from '~/server/db';
import { z } from 'zod';
import { clicksTable, hatcheryTable } from '~/database/schema';
import { and, eq, sql } from 'drizzle-orm';
import type { H3Event } from 'h3';
import { getToken } from '#auth';

type Area = 'garden' | 'seed_tray';

const getCounts = defineCachedFunction(
  async (_, area: string) => {
    const [{ total, scrolls }] = await db
      .select({
        total: sql<number>`COUNT(*)`.as('total'),
        scrolls: sql<number>`COUNT(DISTINCT(${hatcheryTable.user_id}))`.as(
          'scrolls'
        ),
      })
      .from(hatcheryTable)
      .where(
        eq(
          area === 'garden'
            ? hatcheryTable.in_garden
            : hatcheryTable.in_seed_tray,
          true
        )
      );
    return { total, scrolls };
  },
  {
    maxAge: 60,
    getKey: (_, area: string) => area + '-counts',
  }
);

async function getDragons(
  event: H3Event,
  limit: number,
  area: Area = 'garden'
) {
  const token = await getToken({ event });
  let query;

  if (token?.userId) {
    query = db
      .select({ id: hatcheryTable.id, clicked_on: clicksTable.clicked_on })
      .from(hatcheryTable)
      .leftJoin(
        clicksTable,
        and(
          eq(hatcheryTable.id, clicksTable.hatchery_id),
          eq(clicksTable.user_id, token.userId)
        )
      );
  } else {
    query = db
      .select({ id: hatcheryTable.id, clicked_on: sql<null>`null` })
      .from(hatcheryTable);
  }

  return query
    .where(
      eq(
        area === 'garden'
          ? hatcheryTable.in_garden
          : hatcheryTable.in_seed_tray,
        true
      )
    )
    .orderBy(sql`RAND()`)
    .limit(limit);
}

export default defineEventHandler(async (event) => {
  const schema = z.object({
    limit: z.coerce.number().min(10).default(100),
    area: z
      .union([z.literal('seed_tray'), z.literal('garden')])
      .default('garden'),
  });

  const query = await getValidatedQuery(event, schema.parse);

  const [statistics, dragons] = await Promise.all([
    getCounts(event, query.area),
    getDragons(event, query.limit, query.area),
  ]);

  return { statistics, dragons };
});
