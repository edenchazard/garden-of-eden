import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'mysql',
  schema: './database/schema.ts',
  out: './drizzle',
  dbCredentials: {
    user: process.env.NUXT_DB_USER || '',
    password: process.env.NUXT_DB_PASSWORD || '',
    host: process.env.NUXT_DB_HOST || 'localhost',
    port: parseInt(process.env.NUXT_DB_PORT || '3306'),
    database: process.env.NUXT_DB_DATABASE || '',
  },
});
