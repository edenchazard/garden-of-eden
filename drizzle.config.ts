import { defineConfig } from 'drizzle-kit';
import { env } from 'node:process';
console.log('Using database credentials:', env);
export default defineConfig({
  dialect: 'mysql',
  schema: './database/schema.ts',
  out: './drizzle',
  dbCredentials: {
    user: env.NUXT_DB_USER,
    password: env.NUXT_DB_PASSWORD,
    host: env.NUXT_DB_HOST ?? '',
    port: 3306,
    database: env.NUXT_DB_DATABASE ?? '',
  },
});
