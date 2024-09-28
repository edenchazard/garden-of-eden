import type { userSettingsTable, userTable } from '~/database/schema';
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
    code: string;
    in_garden: boolean;
    in_seed_tray: boolean;
    username: string;
  };

  type UserSettings = Omit<typeof userSettingsTable.$inferSelect, 'user_id'>;
  type UserRole = typeof userTable.$inferSelect.role;

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
