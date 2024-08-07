import { defineCronHandler } from "#nuxt/cron";
import pool from "../pool";
import { RowDataPacket } from "mysql2";

export default defineCronHandler("everyThirtyMinutes", async () => {
  const [[{ total, scrolls }]] = await pool.execute<RowDataPacket[]>(
    `SELECT
      COUNT(*) AS total, 
      COUNT(DISTINCT(user_id)) AS scrolls
      FROM hatchery`
  );

  pool.execute(
    pool.format(`INSERT INTO recordings (value, record_type) VALUES (?), (?)`, [
      [total, "total_dragons"],
      [scrolls, "total_scrolls"],
    ])
  );
  /* 
  setCache("current_statistics", {
    total,
    scrolls,
  }); */
});
