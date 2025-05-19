import { defineConfig } from 'drizzle-kit';

const { db } = useRuntimeConfig();

export default defineConfig({
  dialect: 'mysql',
  schema: './database/schema.ts',
  out: './drizzle',
  dbCredentials: {
    user: db.user,
    password: db.password,
    host: db.host,
    port: 3306,
    database: db.database,
  },
});
