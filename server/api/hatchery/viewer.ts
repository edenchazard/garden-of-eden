import type { RowDataPacket } from "mysql2";
import pool from "~/server/pool";

export default defineEventHandler(async (event) => {
  const query = getQuery<{ limit: number }>(event);

  if (!query.limit) {
    query.limit = 10;
  }

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT * FROM hatchery ORDER BY RAND() LIMIT ?`,
    [query.limit]
  );

  return rows as HatcheryDragon[];
});
