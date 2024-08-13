import type { RowDataPacket } from 'mysql2';
import type { H3Event } from 'h3';
import pool from '~/server/pool';
import { z } from 'zod';

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

function getDragons(limit: number, area: string | null) {
  return pool.execute<RowDataPacket[]>(
    `
  SELECT code FROM hatchery
  WHERE in_${area} = 1
  ORDER BY RAND()
  LIMIT ?`,
    [limit]
  );
}

export default defineEventHandler(async (event) => {
  const query = z
    .object({
      limit: z.coerce.number().min(10).default(100),
      area: z
        .union([z.literal('seed_tray'), z.literal('garden')])
        .default('garden'),
    })
    .parse(getQuery(event));

  const [statistics, [dragons]] = await Promise.all([
    getCounts(event, query.area),
    getDragons(query.limit, query.area),
  ]);

  return { statistics, dragons } as {
    statistics: { total: number; scrolls: number };
    dragons: HatcheryDragon[];
  };
});
