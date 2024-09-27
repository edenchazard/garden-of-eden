import type { RowDataPacket } from 'mysql2';
import type { H3Event } from 'h3';
import { db, pool } from '~/server/db';
import { z } from 'zod';
import { hatchery } from '~/database/schema';
import { eq, sql } from 'drizzle-orm';

type Area = 'garden' | 'seed_tray';

const getCounts = defineCachedFunction(
  async (event: H3Event, area: string) => {
    const [[{ total, scrolls }]] = await pool.execute<RowDataPacket[]>(
      `
    SELECT
    COUNT(*) AS total, 
    COUNT(DISTINCT(user_id)) AS scrolls
    FROM hatchery
    WHERE in_${area} = 1`
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
    .select({ id: hatchery.id })
    .from(hatchery)
    .where(
      eq(area === 'garden' ? hatchery.in_garden : hatchery.in_seed_tray, true)
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
