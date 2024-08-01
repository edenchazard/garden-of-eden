import type { RowDataPacket } from "mysql2";
import pool from "~/server/pool";
import { cache } from "~/utils";

export default defineEventHandler(async (event) => {
  const query = getQuery<{ limit: number }>(event);

  if (!query.limit) {
    query.limit = 10;
  }

  const [dragons] = await pool.execute<RowDataPacket[]>(
    `SELECT * FROM hatchery ORDER BY RAND() LIMIT ?`,
    [query.limit]
  );

  const statistics = await cache<{ total: number; scrolls: number }>(
    "statistics",
    1000 * 60,
    async () => {
      const [[{ total, scrolls }]] = await pool.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS total, COUNT(DISTINCT(user_id)) AS scrolls FROM hatchery`
      );

      return {
        total,
        scrolls,
      };
    }
  );

  return { statistics, dragons } as {
    statistics: { total: number; scrolls: number };
    dragons: HatcheryDragon[];
  };
});
