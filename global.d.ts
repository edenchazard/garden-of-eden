import type {
  clicksTable,
  userSettingsTable,
  userTable,
} from '~/database/schema';
export {};

declare global {
  type DragonData = {
    id: string;
    name: string;
    owner: string;
    start: string;
    hatch: string;
    grow: string;
    death: string;
    views: number;
    unique: number;
    clicks: number;
    gender: 'Male' | 'Female';
    acceptaid: boolean;
    hoursleft: number;
    parent_f: string;
    parent_m: string;
  };

  type ScrollView = DragonData & {
    in_garden: boolean;
    in_seed_tray: boolean;
  };

  type HatcheryDragon = {
    id: string;
    clicked_on: typeof clicksTable.$inferSelect.clicked_on | null;
  };

  type UserSettings = Omit<
    typeof userSettingsTable.$inferSelect,
    'user_id',
    'flair'
  >;
  type UserRole = typeof userTable.$inferSelect.role;
  type UserFlair = typeof userSettingsTable.$inferSelect.flair;
  type Item = typeof itemsTable.$inferSelect;

  enum RecordType {
    removed,
    total_dragons,
    total_scrolls,
  }

  interface DragCaveApiResponse<Data extends Record<string, unknown>> {
    errors: Array<[number, string]>;
    data: Data;
  }
}
