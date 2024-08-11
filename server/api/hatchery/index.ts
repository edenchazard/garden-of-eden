import type { RowDataPacket } from 'mysql2';
import pool from '~/server/pool';
import { cache } from '~/utils';
import { z } from 'zod';

function getCounts(key: string, area: string | null) {
  return cache(key, 60 * 1000, async () => {
    const [[{ total, scrolls }]] = await pool.execute<RowDataPacket[]>(
      `
      SELECT
      COUNT(*) AS total, 
      COUNT(DISTINCT(user_id)) AS scrolls
      FROM hatchery
      WHERE in_${area} = 1`
    );

    return { total, scrolls };
  });
}

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
    getCounts(query.area + '-counts', query.area),
    getDragons(query.limit, query.area),
  ]);

  return { statistics, dragons } as {
    statistics: { total: number; scrolls: number };
    dragons: HatcheryDragon[];
  };
});
