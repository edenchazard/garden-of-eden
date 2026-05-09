import { getToken } from '#auth';
import { and, eq } from 'drizzle-orm';
import z from 'zod';
import { caretakerTable } from '~~/database/schema';
import { db } from '~~/server/db';
import type { JWT } from 'next-auth/jwt';

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api/user/scroll/principle')) {
    return;
  }

  const schema = z.object({
    principleId: z.coerce.number(),
  });

  const [token, { principleId }] = await Promise.all([
    getToken({ event }) as Promise<JWT>,
    schema.parseAsync({
      // Due to a nitro/nuxt limitation, router params are not available in middleware.
      // See: https://github.com/nitrojs/nitro/issues/2136
      principleId: /[0-9]+/.exec(event.node.req.url ?? '')?.[0],
    }),
  ]);

  const [caretakerEntry] = await db
    .select()
    .from(caretakerTable)
    .where(
      and(
        eq(caretakerTable.principleId, principleId),
        eq(caretakerTable.caretakerId, token.userId)
      )
    )
    .limit(1);

  if (!caretakerEntry) {
    setResponseStatus(event, 403, 'Forbidden');
    event.node.res.end();
    return 'Unauthorised.';
  }
});
