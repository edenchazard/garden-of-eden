import type { RowDataPacket } from 'mysql2';
import pool from '~/server/pool';
import { cache } from '~/utils';
import { z } from 'zod';

export default defineEventHandler(async (event) => {
  const query = z
    .object({
      limit: z.coerce.number().default(100),
    })
    .parse(getQuery(event));

  const statistics = await cache('current_statistics', 60 * 1000, async () => {
    const [[{ total, scrolls }]] = await pool.execute<RowDataPacket[]>(
      `SELECT
        COUNT(*) AS total, 
        COUNT(DISTINCT(user_id)) AS scrolls
        FROM hatchery`
    );

    return { total, scrolls };
  });

  const [dragons] = await pool.execute<RowDataPacket[]>(
    `SELECT code FROM hatchery ORDER BY RAND() LIMIT ?`,
    [query.limit]
  );

  return { statistics, dragons } as {
    statistics: { total: number; scrolls: number };
    dragons: HatcheryDragon[];
  };
});
