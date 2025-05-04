import { getToken } from '#auth';
import { hatcheryTable } from '~/database/schema';
import type { JWT } from 'next-auth/jwt';
import { createSelectSchema } from 'drizzle-zod';
import { clickRecordQueue } from '~/server/queue';

export default defineEventHandler(async (event) => {
  const schema = createSelectSchema(hatcheryTable).pick({
    id: true,
  });

  const [token, params] = await Promise.all([
    getToken({ event }) as Promise<JWT>,
    getValidatedRouterParams(event, schema.parse),
  ]);

  if (token) {
    await clickRecordQueue.add(
      'clickRecordQueue',
      {
        hatcheryId: params.id,
        userId: token.userId,
      },
      {
        removeOnComplete: {
          age: 1000 * 60 * 60 * 12,
        },
        removeOnFail: {
          age: 1000 * 60 * 60 * 12,
        },
      }
    );
  }

  return sendRedirect(event, `https://dragcave.net/view/${params.id}`);
});
