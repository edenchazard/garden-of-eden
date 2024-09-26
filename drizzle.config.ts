import { defineConfig } from 'drizzle-kit';

const config = process.env;

export default defineConfig({
  dialect: 'mysql',
  schema: './database/schema.ts',
  out: './drizzle',
  dbCredentials: {
    user: config.MYSQL_USER,
    password: config.MYSQL_PASSWORD,
    host: config.MYSQL_HOST,
    port: 3306,
    database: config.MYSQL_DATABASE,
  },
});
