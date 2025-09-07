import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  char,
  datetime,
  index,
  json,
  mediumint,
  mysqlTable,
  smallint,
  tinyint,
  varchar,
  text,
  uniqueIndex,
  int,
} from 'drizzle-orm/mysql-core';
import { createSelectSchema } from 'drizzle-zod';
import type { BannerRequestParameters } from '~/workers/shareScrollWorkerTypes';

export const usersTable = mysqlTable(
  'users',
  {
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
    registeredOn: datetime('registered_on')
      .default(sql`NOW()`)
      .notNull(),
    lastActivity: datetime('last_activity'),
    money: smallint('money').notNull().default(0),
    accessToken: char('access_token', {
      length: 129,
    }),
    apiBlocked: boolean('api_blocked').notNull().default(false),
  },
  (table) => [index('last_activity_idx').on(table.lastActivity)]
);

export const usersSettingsTable = mysqlTable('users_settings', {
  userId: mediumint('user_id', {
    unsigned: true,
  })
    .primaryKey()
    .references(() => usersTable.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  flairId: tinyint('flair_id', {
    unsigned: true,
  }).references(() => itemsTable.id, {
    onDelete: 'set null',
  }),
  sectionOrder: varchar('scroll_order', {
    enum: ['eggs,hatchlings', 'hatchlings,eggs'],
    length: 15,
  })
    .notNull()
    .default('hatchlings,eggs'),
  gardenFrequency: smallint('garden_frequency').notNull().default(30),
  gardenPerPage: smallint('garden_per_page').notNull().default(50),
  seedTrayFrequency: smallint('seed_tray_frequency').notNull().default(30),
  seedTrayPerPage: smallint('seed_tray_per_page').notNull().default(50),
  sort: varchar('sort', {
    length: 32,
    enum: ['Youngest First', 'Oldest First'],
  })
    .notNull()
    .default('Youngest First'),
  scrollLayout: varchar('scroll_layout', {
    length: 10,
    enum: ['table', 'card'],
  })
    .notNull()
    .default('card'),
  hatchlingMinAge: tinyint('hatchling_min_age').notNull().default(0),
  eggMinAge: tinyint('egg_min_age').notNull().default(0),
  showScrollRatio: boolean('show_scroll_ratio').notNull().default(false),
  autoSeedTray: boolean('auto_seed_tray').notNull().default(true),
  siteName: varchar('site_name', {
    length: 5,
    enum: ['Eden', 'Elena'],
  })
    .default('Eden')
    .notNull(),
  highlightClickedDragons: boolean('highlight_clicked_dragons')
    .notNull()
    .default(true),
  anonymiseStatistics: boolean('anonymise_statistics').notNull().default(false),
  bubblewrap: boolean('bubblewrap').notNull().default(false),
  newReleaseAlerts: boolean('new_release_alerts').notNull().default(true),
});

export const hatcheryTable = mysqlTable(
  'hatchery',
  {
    id: char('id', {
      length: 5,
    })
      .primaryKey()
      .notNull(),
    userId: mediumint('user_id', {
      unsigned: true,
    })
      .references(() => usersTable.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    inSeedTray: boolean('in_seed_tray').notNull().default(false),
    inGarden: boolean('in_garden').notNull().default(false),
    isIncubated: boolean('is_incubated').notNull().default(false),
    isStunned: boolean('is_stunned').notNull().default(false),
  },
  (table) => [
    index('in_seed_tray_idx').on(table.inSeedTray, table.userId),
    index('in_garden_idx').on(table.inGarden, table.userId),
  ]
);

export const recordingsTable = mysqlTable(
  'recordings',
  {
    recordedOn: datetime('recorded_on', { mode: 'string' })
      .notNull()
      .default(sql`NOW()`),
    value: bigint('value', { mode: 'number', unsigned: true }).notNull(),
    recordType: varchar('record_type', {
      length: 24,
      enum: [
        'removed',
        'total_dragons',
        'total_scrolls',
        'eggs',
        'adults',
        'hatchlings',
        'dead',
        'hatchlings_male',
        'hatchlings_female',
        'hatchlings_ungendered',
        'caveborn',
        'lineaged',
        'user_count',
        'clean_up',
        'api_request',
      ],
    }).notNull(),
    extra: json('extra')
      .$type<{
        chunks?: number;
        success?: number;
        failures?: number;
        duration?: number;
        eggs?: number;
        hatchlings?: number;
        adults?: number;
        dead?: number;
        hatchlingsUngendered?: number;
        hatchlingsMale?: number;
        hatchlingsFemale?: number;
        caveborn?: number;
        lineaged?: number;
        failure?: number;
      }>()
      .notNull()
      .default({}),
  },
  (table) => [
    index('recorded_on_idx').on(table.recordedOn),
    index('record_type_idx').on(table.recordType),
  ]
);

export const clicksTable = mysqlTable(
  'clicks',
  {
    hatcheryId: char('hatchery_id', {
      length: 5,
    }).notNull(),
    userId: mediumint('user_id', {
      unsigned: true,
    })
      .references(() => usersTable.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    clickedOn: datetime('clicked_on', { mode: 'date' })
      .notNull()
      .default(sql`NOW()`),
  },
  (table) => [
    uniqueIndex('hatchery_id_user_id_idx').on(table.hatcheryId, table.userId),
    index('user_id_clicked_on_idx').on(table.userId, table.clickedOn),
    index('clicked_on_idx').on(table.clickedOn),
  ]
);

export const clicksLeaderboardsTable = mysqlTable(
  'clicks_leaderboards',
  {
    userId: mediumint('user_id', {
      unsigned: true,
    })
      .references(() => usersTable.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    leaderboard: varchar('leaderboard', {
      enum: ['weekly', 'all time'],
      length: 10,
    }).notNull(),
    start: datetime('start').notNull(),
    rank: mediumint('rank', { unsigned: true }).notNull(),
    clicksGiven: bigint('clicks_given', { mode: 'number', unsigned: true })
      .notNull()
      .default(0),
  },
  (table) => [
    index('clicks_given_idx').on(table.clicksGiven),
    uniqueIndex('leaderboard_start_user_idIdx').on(
      table.leaderboard,
      table.start,
      table.userId
    ),
  ]
);

export const itemsTable = mysqlTable('items', {
  id: tinyint('id', {
    unsigned: true,
  })
    .autoincrement()
    .primaryKey(),
  name: varchar('name', {
    length: 48,
  }).notNull(),
  url: varchar('url', {
    length: 64,
  }).notNull(),
  category: varchar('category', {
    length: 24,
    enum: ['flair', 'trophy', 'consumable'],
  }).notNull(),
  availableFrom: datetime('available_from', {
    mode: 'string',
  }),
  availableTo: datetime('available_to', {
    mode: 'string',
  }),
  releaseDate: datetime('release_date', {
    mode: 'string',
  }),
  daysAvailable: smallint('days_available'),
  description: varchar('description', {
    length: 255,
  }).notNull(),
  cost: smallint('cost'),
  artist: varchar('artist', {
    length: 64,
  }),
});

export const userItemTable = mysqlTable('user_item', {
  id: bigint('id', {
    unsigned: true,
    mode: 'number',
  })
    .autoincrement()
    .primaryKey(),
  itemId: tinyint('item_id', {
    unsigned: true,
  })
    .references(() => itemsTable.id, {
      onDelete: 'restrict',
    })
    .notNull(),
  userId: mediumint('user_id', {
    unsigned: true,
  })
    .references(() => usersTable.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  purchasedOn: datetime('purchased_on', { mode: 'date' })
    .default(sql`NOW()`)
    .notNull(),
});

export const userBannerJobTable = mysqlTable('user_banner_job', {
  id: bigint('id', {
    unsigned: true,
    mode: 'number',
  })
    .autoincrement()
    .primaryKey(),
  userId: mediumint('user_id', {
    unsigned: true,
  })
    .references(() => usersTable.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  username: varchar('username', {
    length: 32,
  }).notNull(),
  flairPath: varchar('flair_path', {
    length: 100,
  }),
  dragonsIncluded: json('dragons_included').$type<string[]>(),
  dragonsOmitted: json('dragons_omitted').$type<string[]>(),
  statGenTime: mediumint('stat_gen_time', { unsigned: true }),
  dragonFetchTime: mediumint('dragon_fetch_time', { unsigned: true }),
  dragonGenTime: mediumint('dragon_gen_time', { unsigned: true }),
  frameGenTime: mediumint('frame_gen_time', { unsigned: true }),
  gifGenTime: mediumint('gif_gen_time', { unsigned: true }),
  totalTime: mediumint('total_time', { unsigned: true }),
  error: text('error'),
  createdAt: datetime('created_at', { mode: 'date' })
    .default(sql`NOW()`)
    .notNull(),
  requestParams: json('request_params').$type<BannerRequestParameters>(),
});

export const userTrophyTable = mysqlTable(
  'user_trophy',
  {
    id: bigint('id', { unsigned: true, mode: 'number' })
      .autoincrement()
      .primaryKey(),
    userId: mediumint('user_id', {
      unsigned: true,
    })
      .references(() => usersTable.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    itemId: tinyint('item_id', {
      unsigned: true,
    })
      .references(() => itemsTable.id, {
        onDelete: 'restrict',
      })
      .notNull(),
    awardedOn: datetime('awarded_on', { mode: 'date' }).notNull(),
  },
  (table) => [index('user_id_awarded_on_idx').on(table.userId, table.awardedOn)]
);

export const dragCaveFeedTable = mysqlTable('dragcave_feed', {
  id: bigint('id', { unsigned: true, mode: 'number' })
    .autoincrement()
    .primaryKey(),
  guid: int('guid', { unsigned: true }).unique(),
  link: text('link').notNull(),
});

export const userNotificationTable = mysqlTable(
  'user_notification',
  {
    id: bigint('id', { unsigned: true, mode: 'number' })
      .autoincrement()
      .primaryKey(),
    userId: mediumint('user_id', {
      unsigned: true,
    })
      .references(() => usersTable.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    guid: int('guid', { unsigned: true }),
    type: varchar('type', {
      length: 10,
      enum: ['dragcave'],
    }).notNull(),
    validUntil: datetime('valid_until', { mode: 'date' }),
    content: text('content').notNull(),
    createdAt: datetime('created_at', { mode: 'date' })
      .default(sql`NOW()`)
      .notNull(),
  },
  (table) => [
    index('created_at_valid_until_idx').on(table.createdAt, table.validUntil),
  ]
);

export const userSettingsSchema = createSelectSchema(usersSettingsTable, {
  gardenFrequency: (schema) => schema.min(15).max(300).default(30),
  gardenPerPage: (schema) => schema.min(10).max(500).default(500),
  seedTrayFrequency: (schema) => schema.min(15).max(300).default(30),
  seedTrayPerPage: (schema) => schema.min(10).max(500).default(200),
  sort: (schema) => schema.default('Youngest First'),
  scrollLayout: (schema) => schema.default('card'),
  hatchlingMinAge: (schema) => schema.max(72).min(0).default(0),
  eggMinAge: (schema) => schema.max(72).min(0).default(0),
  showScrollRatio: (schema) => schema.default(true),
  autoSeedTray: (schema) => schema.default(true),
  siteName: (schema) => schema.default('Eden'),
  highlightClickedDragons: (schema) => schema.default(true),
  anonymiseStatistics: (schema) => schema.default(false),
  flairId: (schema) => schema.nullable().default(null),
  sectionOrder: (schema) => schema.default('hatchlings,eggs'),
  bubblewrap: (schema) => schema.default(false),
  newReleaseAlerts: (schema) => schema.default(true),
}).omit({ userId: true, flairId: true });
