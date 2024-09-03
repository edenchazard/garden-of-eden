import { z } from 'zod';
import { getToken } from '#auth';
import pool from '~/server/pool';

export default defineEventHandler(async (event) => {
  const schema = z.object({
    id: z.number().min(1),
  });

  const [token, params] = await Promise.all([
    getToken({ event }),
    getValidatedRouterParams(event, schema.parse),
  ]);

  pool.execute(
    'DELETE FROM caretakers WHERE user_id = ? AND caretaker_user_id = ?',
    [token?.userId, params.id]
  );

  sendNoContent(event);
});
