import { randomUUID } from 'node:crypto';
import { getToken } from '#auth';
import type { JWT } from 'next-auth/jwt';
import { caretakerInviteTable } from '~~/database/schema';
import { db } from '~~/server/db';
import { DateTime } from 'luxon';

export default defineEventHandler(async (event) => {
  const token = (await getToken({ event })) as JWT;
  const code = randomUUID();
  const expiresAt = DateTime.now().plus({ hours: 1 }).toJSDate();

  await db.insert(caretakerInviteTable).values({
    code,
    principleId: token.userId,
    expiresAt,
  });

  return {
    code,
    expiresAt,
  };
});
