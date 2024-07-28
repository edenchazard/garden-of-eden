import type { RowDataPacket } from "mysql2";
import pool from "~/server/pool";
import { cache } from "~/utils";

export default defineEventHandler(async (event) => {
  return await cache<{ total: number; scrolls: number }>(
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
});
