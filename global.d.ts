import type {
  userSettingsTable,
  userTable,
  itemsTable,
} from '~/database/schema';
import type { DragonData } from './types/DragonTypes';
export {};

declare global {
  type ScrollView = DragonData & {
    in_garden: boolean;
    in_seed_tray: boolean;
    is_incubated: boolean;
    is_stunned: boolean;
  };

  type HatcheryDragon = {
    id: string;
    clicked_on: string | null;
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
