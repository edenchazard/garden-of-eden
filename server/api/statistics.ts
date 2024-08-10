import type { RowDataPacket } from "mysql2";
import pool from "~/server/pool";
import { cache } from "~/utils";

export default defineEventHandler(async () => {
  return await cache("statistics", 1000 * 60 * 5, async () => {
    const [[scrolls], [dragons]] = await Promise.all([
      pool.execute<RowDataPacket[]>(
        `SELECT recorded_on, value FROM recordings
        WHERE record_type = 'total_scrolls'
        ORDER BY recorded_on DESC
        LIMIT 48`
      ),
      pool.execute<RowDataPacket[]>(
        `SELECT recorded_on, value FROM recordings
      WHERE record_type = 'total_dragons'
      ORDER BY recorded_on DESC
      LIMIT 48`
      ),
    ]);

    // since we got them in descending order (latest 48),
    // we then have to reverse them for proper left-to-right display
    scrolls.reverse();
    dragons.reverse();

    return {
      scrolls,
      dragons,
    } as {
      scrolls: { recorded_on: string; value: number }[];
      dragons: { recorded_on: string; value: number }[];
    };
  });
});
