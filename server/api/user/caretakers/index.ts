import pool from '~/server/pool';
import { getToken } from '#auth';
import type { RowDataPacket } from 'mysql2';

export default defineEventHandler(async (event) => {
  const token = await getToken({ event });
  /* 
  const [users] = pool.execute<RowDataPacket[]>(
    `SELECT caretakers.caretaker_user_id, users.username
    FROM caretakers
    WHERE user_id = ?`,
    [token?.userId]
  ); */

  const users = [
    {
      caretaker_user_id: 1,
      username: 'TJ09',
    },
  ];

  return users;
});
