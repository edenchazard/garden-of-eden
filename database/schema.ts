import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  char,
  datetime,
  json,
  mediumint,
  mysqlTable,
  smallint,
  tinyint,
  varchar,
} from 'drizzle-orm/mysql-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const user = mysqlTable('users', {
  id: mediumint('id', { unsigned: true }).primaryKey().notNull(),
  username: varchar('username', {
    length: 32,
  }).notNull(),
  role: varchar('role', {
    length: 10,
    enum: ['user', 'owner'],
  })
    .default('user')
    .notNull(),
  registered_on: datetime('registered_on')
    .default(sql`NOW()`)
    .notNull(),
});

export const userSettings = mysqlTable('user_settings', {
  user_id: mediumint('user_id', {
    unsigned: true,
  })
    .primaryKey()
    .references(() => user.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  gardenFrequency: smallint('gardenFrequency').notNull().default(30),
  gardenPerPage: smallint('gardenPerPage').notNull().default(50),
  seedTrayFrequency: smallint('seedTrayFrequency').notNull().default(30),
  seedTrayPerPage: smallint('seedTrayPerPage').notNull().default(50),
  sort: varchar('sort', {
    length: 32,
    enum: ['Youngest First', 'Oldest First'],
  })
    .notNull()
    .default('Youngest First'),
  hatchlingMinAge: tinyint('hatchlingMinAge').notNull().default(0),
  eggMinAge: tinyint('eggMinAge').notNull().default(0),
  showScrollRatio: boolean('showScrollRatio').notNull().default(false),
  autoSeedTray: boolean('autoSeedTray').notNull().default(true),
  siteName: varchar('siteName', {
    length: 5,
    enum: ['Eden', 'Elena'],
  })
    .default('Eden')
    .notNull(),
});

export const hatchery = mysqlTable('hatchery', {
  id: char('id', {
    length: 5,
  })
    .primaryKey()
    .notNull(),
  user_id: mediumint('user_id', {
    unsigned: true,
  })
    .references(() => user.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  in_seed_tray: boolean('in_seed_tray').notNull().default(false),
  in_garden: boolean('in_garden').notNull().default(false),
});

export const recordings = mysqlTable('recordings', {
  recorded_on: datetime('recorded_on')
    .notNull()
    .default(sql`NOW()`),
  value: bigint('value', { mode: 'number', unsigned: true }).notNull(),
  record_type: varchar('record_type', {
    length: 24,
    enum: ['removed', 'total_dragons', 'total_scrolls'],
  }).notNull(),
  extra: json('extra'),
});

export const userSettingsSchema = createSelectSchema(userSettings, {
  gardenFrequency: (schema) => schema.gardenFrequency.default(30),
  gardenPerPage: (schema) => schema.gardenPerPage.min(10).default(100),
  seedTrayFrequency: (schema) => schema.seedTrayFrequency.default(30),
  seedTrayPerPage: (schema) => schema.seedTrayPerPage.min(10).default(100),
  sort: (schema) => schema.sort.default('Youngest First'),
  hatchlingMinAge: (schema) => schema.hatchlingMinAge.max(72).min(0).default(0),
  eggMinAge: (schema) => schema.eggMinAge.max(72).min(0).default(0),
  showScrollRatio: (schema) => schema.showScrollRatio.default(true),
  autoSeedTray: (schema) => schema.autoSeedTray.default(true),
  siteName: (schema) => schema.siteName.default('Eden'),
}).omit({ user_id: true });
