import { db } from '~/server/db';
import { getToken } from '#auth';
import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import { hatcheryTable } from '~/database/schema';
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
      in_garden: true,
      in_seed_tray: true,
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
        not(eq(hatcheryTable.user_id, token.userId))
      )
    );

    if (dragons.length > 0) {
      await tx
        .insert(hatcheryTable)
        .values(
          dragons.map((dragon) => ({
            id: dragon.id,
            user_id: token.userId,
            in_garden: dragon.in_garden,
            in_seed_tray: dragon.in_seed_tray,
          }))
        )
        .onDuplicateKeyUpdate({
          set: buildConflictUpdateColumns(hatcheryTable, [
            'in_garden',
            'in_seed_tray',
          ]),
        });
    }
    return dragons.map((dragon) => dragon.id);
  });
});
