import { getToken } from '#auth';
import { and, eq, inArray, not } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';
import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import { caretakerAuditLogTable, hatcheryTable } from '~~/database/schema';
import { db } from '~~/server/db';
import buildConflictUpdateColumns from '~~/server/utils/buildConflictUpdateColumns';

export default defineEventHandler(async (event) => {
  const { principalId } = await getValidatedRouterParams(
    event,
    z.object({
      principalId: z.coerce.number(),
    }).parse
  );

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
                eq(hatcheryTable.userId, principalId),
                inArray(hatcheryTable.id, dragonIds)
              )
            )
        : [];

    await tx
      .delete(hatcheryTable)
      .where(
        and(
          inArray(hatcheryTable.id, dragonIds),
          not(eq(hatcheryTable.userId, principalId))
        )
      );

    if (dragons.length > 0) {
      await tx
        .insert(hatcheryTable)
        .values(
          dragons.map((dragon) => ({
            id: dragon.id,
            userId: principalId,
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
      principalId,
      caretakerId: token.userId,
      changes: { added, removed, unchanged },
    });

    return dragons
      .filter((dragon) => dragon.inGarden || dragon.inSeedTray)
      .map((dragon) => dragon.id);
  });
});
