import { migrate } from 'drizzle-orm/mysql2/migrator';
import { db } from '~/server/db';

export default defineNitroPlugin(async () => {
  if (!import.meta.dev) {
    return;
  }

  console.info('Database migrations started');
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.info('Database migrations done');
  } catch (err) {
    console.warn('Database migrations failed', err);
  }
});
