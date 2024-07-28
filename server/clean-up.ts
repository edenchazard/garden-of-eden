import { RowDataPacket } from "mysql2";
import pool from "~/server/pool";

export async function cleanUp() {
  const { clientSecret } = useRuntimeConfig();

  console.log("Clean up in progress.");
  const start = new Date().getTime();

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
      Authorization: `Bearer ${clientSecret}`,
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

  if (toDelete.length) {
    await pool.execute<RowDataPacket[]>(
      `DELETE FROM hatchery WHERE code IN (` +
        toDelete.map((id) => `'${id}'`).join(",") +
        `)`
    );
  }

  const end = new Date().getTime();

  console.log(
    `Clean up complete in ${end - start}ms. ${toDelete.length} dragons removed.`
  );
}
