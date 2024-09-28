import type { H3Event } from 'h3';
import { db } from '~/server/db';
import { z } from 'zod';
import { hatcheryTable } from '~/database/schema';
import { eq, sql } from 'drizzle-orm';

type Area = 'garden' | 'seed_tray';

const getCounts = defineCachedFunction(
  async (event: H3Event, area: string) => {
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
    getKey: (event: H3Event, area: string) => area + '-counts',
  }
);

function getDragons(limit: number, area: Area = 'garden') {
  return db
    .select({ id: hatcheryTable.id })
    .from(hatcheryTable)
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
    getDragons(query.limit, query.area),
  ]);

  return { statistics, dragons };
});
