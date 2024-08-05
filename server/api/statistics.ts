import type { RowDataPacket } from "mysql2";
import pool from "~/server/pool";
import { cache } from "~/utils";

export default defineEventHandler(async (event) => {
  return await cache("records_totals", 1000 * 60 * 5, async () => {
    const [[scrolls], [dragons]] = await Promise.all([
      pool.execute<RowDataPacket[]>(
        `SELECT recorded_on, value FROM recordings
        WHERE record_type = 'total_scrolls'
        ORDER BY recorded_on ASC
        LIMIT 144`
      ),
      pool.execute<RowDataPacket[]>(
        `SELECT recorded_on, value FROM recordings
      WHERE record_type = 'total_dragons'
      ORDER BY recorded_on ASC
      LIMIT 14`
      ),
    ]);

    return {
      scrolls,
      dragons,
    } as {
      scrolls: { recorded_on: string; value: number }[];
      dragons: { recorded_on: string; value: number }[];
    };
  });
});
