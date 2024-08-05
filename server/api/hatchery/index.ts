import type { RowDataPacket } from "mysql2";
import pool from "~/server/pool";
import { cache } from "~/utils";
import { z } from "zod";

export default defineEventHandler(async (event) => {
  const query = z
    .object({
      limit: z.coerce.number().default(50),
    })
    .parse(getQuery(event));

  const [dragons] = await pool.execute<RowDataPacket[]>(
    `SELECT code FROM hatchery ORDER BY RAND() LIMIT ?`,
    [query.limit]
  );

  return { statistics: await cache("statistics"), dragons } as {
    statistics: { total: number; scrolls: number };
    dragons: HatcheryDragon[];
  };
});
