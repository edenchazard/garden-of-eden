import { db } from '~/server/db';
import { getToken } from '#auth';
import { hatcheryTable, clicksTable } from '~/database/schema';
import type { JWT } from 'next-auth/jwt';
import { createSelectSchema } from 'drizzle-zod';

export default defineEventHandler(async (event) => {
  const schema = createSelectSchema(hatcheryTable).pick({
    id: true,
  });

  const [token, query] = await Promise.all([
    getToken({ event }) as Promise<JWT>,
    readValidatedBody(event, schema.parse),
  ]);

  await db.insert(clicksTable).ignore().values({
    hatchery_id: query.id,
    user_id: token.userId,
  });

  return sendNoContent(event);
});
