import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from '~/database/schema';

export const pool = mysql.createPool({
  ...useRuntimeConfig().db,
  connectionLimit: 20,
  multipleStatements: true,
});

export const db = drizzle(pool, { schema, mode: 'default' });
