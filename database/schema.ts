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
  unique,
  varchar,
  text,
} from 'drizzle-orm/mysql-core';
import { createSelectSchema } from 'drizzle-zod';
import type { BannerRequestParameters } from '~/workers/shareScrollWorkerTypes';

export const userTable = mysqlTable(
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
    registered_on: datetime('registered_on')
      .default(sql`NOW()`)
      .notNull(),
    last_activity: datetime('last_activity'),
    money: smallint('money').notNull().default(0),
    accessToken: char('access_token', {
      length: 129,
    }),
  },
  (table) => {
    return {
      last_activityId: index('last_activity_idx').on(table.last_activity),
    };
  }
);

export const userSettingsTable = mysqlTable('user_settings', {
  user_id: mediumint('user_id', {
    unsigned: true,
  })
    .primaryKey()
    .references(() => userTable.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  flair_id: tinyint('flair_id', {
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
  highlightClickedDragons: boolean('highlightClickedDragons')
    .notNull()
    .default(true),
  anonymiseStatistics: boolean('anonymiseStatistics').notNull().default(false),
  bubblewrap: boolean('bubblewrap').notNull().default(false),
});

export const hatcheryTable = mysqlTable(
  'hatchery',
  {
    id: char('id', {
      length: 5,
    })
      .primaryKey()
      .notNull(),
    user_id: mediumint('user_id', {
      unsigned: true,
    })
      .references(() => userTable.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    in_seed_tray: boolean('in_seed_tray').notNull().default(false),
    in_garden: boolean('in_garden').notNull().default(false),
    is_incubated: boolean('is_incubated').notNull().default(false),
    is_stunned: boolean('is_stunned').notNull().default(false),
  },
  (table) => {
    return {
      in_seed_trayIdx: index('in_seed_tray_idx').on(
        table.in_seed_tray,
        table.user_id
      ),
      in_gardenIdx: index('in_garden_idx').on(table.in_garden, table.user_id),
    };
  }
);

export const recordingsTable = mysqlTable(
  'recordings',
  {
    recorded_on: datetime('recorded_on', { mode: 'string' })
      .notNull()
      .default(sql`NOW()`),
    value: bigint('value', { mode: 'number', unsigned: true }).notNull(),
    record_type: varchar('record_type', {
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
  (table) => {
    return {
      recorded_onIdx: index('recorded_on_idx').on(table.recorded_on),
      record_typeIdx: index('record_type_idx').on(table.record_type),
    };
  }
);

export const clicksTable = mysqlTable(
  'clicks',
  {
    hatchery_id: char('hatchery_id', {
      length: 5,
    }).notNull(),
    user_id: mediumint('user_id', {
      unsigned: true,
    })
      .references(() => userTable.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    clicked_on: datetime('clicked_on', { mode: 'date' })
      .notNull()
      .default(sql`NOW()`),
  },
  (table) => {
    return {
      hatchery_id_user_idIdx: unique('hatchery_id_user_id_idx').on(
        table.hatchery_id,
        table.user_id
      ),
      user_id_clicked_onIdx: index('user_id_clicked_on_idx').on(
        table.user_id,
        table.clicked_on
      ),
      clicked_onIdx: index('clicked_on_idx').on(table.clicked_on),
    };
  }
);

export const clicksLeaderboardTable = mysqlTable(
  'clicks_leaderboard',
  {
    user_id: mediumint('user_id', {
      unsigned: true,
    })
      .references(() => userTable.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    leaderboard: varchar('leaderboard', {
      enum: ['weekly', 'all time'],
      length: 10,
    }).notNull(),
    start: datetime('start').notNull(),
    rank: mediumint('rank', { unsigned: true }).notNull(),
    clicks_given: bigint('clicks_given', { mode: 'number', unsigned: true })
      .notNull()
      .default(0),
  },
  (table) => {
    return {
      clicks_givenIdx: index('clicks_given_idx').on(table.clicks_given),
      leaderboard_start_user_idIdx: unique('leaderboard_start_user_idIdx').on(
        table.leaderboard,
        table.start,
        table.user_id
      ),
    };
  }
);

export const itemsTable = mysqlTable('items', {
  id: tinyint('id', {
    unsigned: true,
  })
    .autoincrement()
    .primaryKey(),
  name: varchar('name', {
    length: 24,
  }).notNull(),
  url: varchar('url', {
    length: 24,
  }),
  category: varchar('category', {
    length: 24,
    enum: ['flair', 'trophy'],
  }).notNull(),
  availableFrom: datetime('available_from', {
    mode: 'string',
  }),
  availableTo: datetime('available_to', {
    mode: 'string',
  }),
  description: varchar('description', {
    length: 255,
  }).notNull(),
  cost: smallint('cost'),
  artist: varchar('artist', {
    length: 64,
  }),
});

export const purchasesTable = mysqlTable('purchases', {
  id: bigint('id', {
    unsigned: true,
    mode: 'number',
  })
    .autoincrement()
    .primaryKey(),
  item_id: tinyint('item_id', {
    unsigned: true,
  })
    .references(() => itemsTable.id, {
      onDelete: 'restrict',
    })
    .notNull(),
  user_id: mediumint('user_id', {
    unsigned: true,
  })
    .references(() => userTable.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  purchased_on: datetime('purchased_on', { mode: 'date' })
    .default(sql`NOW()`)
    .notNull(),
});

export const bannerJobsTable = mysqlTable('banner_jobs', {
  id: bigint('id', {
    unsigned: true,
    mode: 'number',
  })
    .autoincrement()
    .primaryKey(),
  userId: mediumint('user_id', {
    unsigned: true,
  })
    .references(() => userTable.id, {
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

export const userTrophiesTable = mysqlTable('users_trophies', {
  user_id: mediumint('user_id', {
    unsigned: true,
  })
    .references(() => userTable.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  item_id: tinyint('item_id', {
    unsigned: true,
  })
    .references(() => itemsTable.id, {
      onDelete: 'restrict',
    })
    .notNull(),
  awarded_on: datetime('awarded_on', { mode: 'date' }).notNull(),
});

export const userSettingsSchema = createSelectSchema(userSettingsTable, {
  gardenFrequency: (schema) =>
    schema.gardenFrequency.min(15).max(300).default(30),
  gardenPerPage: (schema) => schema.gardenPerPage.min(10).max(500).default(500),
  seedTrayFrequency: (schema) =>
    schema.seedTrayFrequency.min(15).max(300).default(30),
  seedTrayPerPage: (schema) =>
    schema.seedTrayPerPage.min(10).max(500).default(200),
  sort: (schema) => schema.sort.default('Youngest First'),
  hatchlingMinAge: (schema) => schema.hatchlingMinAge.max(72).min(0).default(0),
  eggMinAge: (schema) => schema.eggMinAge.max(72).min(0).default(0),
  showScrollRatio: (schema) => schema.showScrollRatio.default(true),
  autoSeedTray: (schema) => schema.autoSeedTray.default(true),
  siteName: (schema) => schema.siteName.default('Eden'),
  highlightClickedDragons: (schema) =>
    schema.highlightClickedDragons.default(true),
  anonymiseStatistics: (schema) => schema.anonymiseStatistics.default(false),
  flair_id: (schema) => schema.flair_id.nullable().default(null),
  sectionOrder: (schema) => schema.sectionOrder.default('hatchlings,eggs'),
  bubblewrap: (schema) => schema.bubblewrap.default(false),
}).omit({ user_id: true, flair_id: true });
