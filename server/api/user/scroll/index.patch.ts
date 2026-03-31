import { db } from '~~/server/db';
import { getToken } from '#auth';
import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import { hatcheryTable } from '~~/database/schema';
import { and, eq, inArray, not, sql, getTableColumns } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';
import type { MySqlTable } from 'drizzle-orm/mysql-core';

function buildConflictUpdateColumns<
  T extends MySqlTable,
  Q extends keyof T['_']['columns'],
>(table: T, columns: Q[]) {
  const cls = getTableColumns(table);
  return columns.reduce(
    (acc, column) => {
      acc[column] = sql`values(${cls[column]})`;
      return acc;
    },
    {} as Record<Q, SQL>
  );
}

export default defineEventHandler(async (event) => {
  const schema = z.array(
    createInsertSchema(hatcheryTable).pick({
      id: true,
      inGarden: true,
      inSeedTray: true,
    })
  );

  const [token, dragons] = await Promise.all([
    getToken({ event }) as Promise<JWT>,
    readValidatedBody(event, schema.parse),
  ]);

  return await db.transaction(async (tx) => {
    await tx.delete(hatcheryTable).where(
      and(
        inArray(
          hatcheryTable.id,
          dragons.map((dragon) => dragon.id)
        ),
        not(eq(hatcheryTable.userId, token.userId))
      )
    );

    if (dragons.length > 0) {
      await tx
        .insert(hatcheryTable)
        .values(
          dragons.map((dragon) => ({
            id: dragon.id,
            userId: token.userId,
            inGarden: dragon.inGarden,
            inSeedTray: dragon.inSeedTray,
          }))
        )
        .onDuplicateKeyUpdate({
          set: buildConflictUpdateColumns(hatcheryTable, [
            'inGarden',
            'inSeedTray',
          ]),
        });
    }
    return dragons
      .filter((dragon) => dragon.inGarden || dragon.inSeedTray)
      .map((dragon) => dragon.id);
  });
});
