import { db } from '~/server/db';
import { getToken } from '#auth';
import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import { hatcheryTable } from '~/database/schema';
import { eq, inArray, or } from 'drizzle-orm';
import type { JWT } from 'next-auth/jwt';

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
      or(
        eq(hatcheryTable.user_id, token.userId),
        inArray(
          hatcheryTable.id,
          dragons.map((dragon) => dragon.id)
        )
      )
    );

    const add = dragons.filter(
      (dragon) => dragon.in_garden || dragon.in_seed_tray
    );

    if (add.length > 0) {
      await tx
        .insert(hatcheryTable)
        .ignore()
        .values(
          add.map((dragon) => ({
            id: dragon.id,
            user_id: token.userId,
            in_garden: dragon.in_garden,
            in_seed_tray: dragon.in_seed_tray,
          }))
        );
    }
    return add.map((dragon) => dragon.id);
  });
});
