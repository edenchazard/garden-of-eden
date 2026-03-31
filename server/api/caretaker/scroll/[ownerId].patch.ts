import { getToken } from '#auth';
import { and, eq, inArray, not, sql, getTableColumns } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';
import type { SQL } from 'drizzle-orm';
import type { MySqlTable } from 'drizzle-orm/mysql-core';
import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import {
  caretakerAuditLogTable,
  caretakerTable,
  hatcheryTable,
} from '~~/database/schema';
import { db } from '~~/server/db';

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

  const ownerIdParam = getRouterParam(event, 'ownerId');
  const ownerId = parseInt(ownerIdParam ?? '');

  if (!ownerId || isNaN(ownerId)) {
    setResponseStatus(event, 400, 'Bad Request');
    return 'Bad Request';
  }

  const [token, dragons] = await Promise.all([
    getToken({ event }) as Promise<JWT>,
    readValidatedBody(event, schema.parse),
  ]);

  const [caretakerEntry] = await db
    .select()
    .from(caretakerTable)
    .where(
      and(
        eq(caretakerTable.userId, token.userId),
        eq(caretakerTable.ownerId, ownerId),
        eq(caretakerTable.approved, true),
        eq(caretakerTable.blocked, false)
      )
    )
    .limit(1);

  if (!caretakerEntry) {
    setResponseStatus(event, 403, 'Forbidden');
    return 'Forbidden';
  }

  return await db.transaction(async (tx) => {
    const dragonIds = dragons.map((d) => d.id);

    const before =
      dragonIds.length > 0
        ? await tx
            .select({
              id: hatcheryTable.id,
              inGarden: hatcheryTable.inGarden,
              inSeedTray: hatcheryTable.inSeedTray,
            })
            .from(hatcheryTable)
            .where(
              and(
                eq(hatcheryTable.userId, ownerId),
                inArray(hatcheryTable.id, dragonIds)
              )
            )
        : [];

    await tx
      .delete(hatcheryTable)
      .where(
        and(
          inArray(hatcheryTable.id, dragonIds),
          not(eq(hatcheryTable.userId, ownerId))
        )
      );

    if (dragons.length > 0) {
      await tx
        .insert(hatcheryTable)
        .values(
          dragons.map((dragon) => ({
            id: dragon.id,
            userId: ownerId,
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

    const beforeMap = new Map(before.map((d) => [d.id, d]));
    const added: string[] = [];
    const removed: string[] = [];
    const unchanged: string[] = [];

    for (const dragon of dragons) {
      const prev = beforeMap.get(dragon.id);
      const wasActive = prev ? prev.inGarden || prev.inSeedTray : false;
      const isActive = dragon.inGarden || dragon.inSeedTray;

      if (!wasActive && isActive) {
        added.push(dragon.id);
      } else if (wasActive && !isActive) {
        removed.push(dragon.id);
      } else {
        unchanged.push(dragon.id);
      }
    }

    await tx.insert(caretakerAuditLogTable).values({
      userId: token.userId,
      ownerId,
      dragons: { added, removed, unchanged },
    });

    return dragons
      .filter((dragon) => dragon.inGarden || dragon.inSeedTray)
      .map((dragon) => dragon.id);
  });
});
