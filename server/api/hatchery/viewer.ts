import type { RowDataPacket } from "mysql2";
import pool from "~/server/pool";

export default defineEventHandler(async (event) => {
  const [rows] = await pool.execute<RowDataPacket[]>(`SELECT * FROM hatchery`);

  return rows;
});
