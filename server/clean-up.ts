import { RowDataPacket } from "mysql2";
import pool from "~/server/pool";
import chunkArray from "~/utils/chunkArray";

export async function cleanUp() {
  const { clientSecret } = useRuntimeConfig();

  const start = new Date().getTime();

  const [codes] = await pool.execute<RowDataPacket[]>(
    `SELECT code FROM hatchery`
  );

  const chunkedDragons = chunkArray(codes, 400);
  const apiResponse = await Promise.all(
    chunkedDragons.map((chunk) =>
      $fetch<{
        errors: unknown[];
        dragons: Record<string, DragonData>;
      }>(`https://dragcave.net/api/v2/dragons`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          ids: chunk.map((dragon) => dragon.code).join(","),
        }),
      })
    )
  );

  const toDelete = apiResponse
    .flatMap((response) => Object.values(response.dragons))
    .filter((dragon) => dragon.hoursleft < 0)
    .map((dragon) => dragon.id);

  if (toDelete.length) {
    await pool.execute<RowDataPacket[]>(
      `DELETE FROM hatchery WHERE code IN (` +
        toDelete.map((id) => `'${id}'`).join(",") +
        `)`
    );
  }

  const end = new Date().getTime();

  pool.execute(
    `INSERT INTO recordings (value, record_type, extra) VALUES (?, ?, ?)`,
    [toDelete.length, "removed", JSON.stringify({ start, end })]
  );
}
