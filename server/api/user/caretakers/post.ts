import pool from '~/server/pool';
import { getToken } from '#auth';
import { z } from 'zod';
import type { RowDataPacket } from 'mysql2';

export default defineEventHandler(async (event) => {
  const schema = z.object({
    caretakerUsername: z.string().min(1).max(30),
  });

  const [token, body] = await Promise.all([
    getToken({ event }),
    readValidatedBody(event, schema.parse),
  ]);

  const [[{ id: caretakerUserId }]] = await pool.execute<RowDataPacket[]>(
    'SELECT id FROM users WHERE username = ?',
    [body.caretakerUsername]
  );

  if (!caretakerUserId) {
    setResponseStatus(event, 404);
    return 'Not Found';
  }

  pool.execute(
    'INSERT IGNORE INTO caretakers (user_id, caretaker_user_id) VALUES (?, ?)',
    [token?.userId, caretakerUserId]
  );

  sendNoContent(event);
});
