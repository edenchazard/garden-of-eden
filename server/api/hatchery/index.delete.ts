import { RowDataPacket } from "mysql2";
import config from "~/server/config";
import pool from "~/server/pool";

export default defineEventHandler(async (event) => {
  const [dragons] = await pool.execute<RowDataPacket[]>(
    `SELECT code FROM hatchery`
  );

  const params = new URLSearchParams();
  params.append("ids", dragons.map((dragon) => dragon.code).join(","));

  const response = await $fetch<{
    errors: unknown[];
    dragons: Record<string, DragonData>;
  }>(`https://dragcave.net/api/v2/dragons`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.clientSecret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const toDelete = [];

  for (const id in response.dragons) {
    if (response.dragons[id].hoursleft < 0) {
      toDelete.push(id);
    }
  }

  if (!toDelete.length) {
    return;
  }

  await pool.execute<RowDataPacket[]>(
    `DELETE FROM hatchery WHERE code IN (` +
      toDelete.map((id) => `'${id}'`).join(",") +
      `)`
  );
});
