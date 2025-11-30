import type {
  usersSettingsTable,
  usersTable,
  itemsTable,
  hatcheryTable,
} from '~~/database/schema';
import type { DragonData } from '../types/DragonTypes';
export {};

declare global {
  type ScrollView = DragonData &
    Pick<
      typeof hatcheryTable.$inferSelect,
      'inGarden' | 'inSeedTray' | 'isIncubated' | 'isStunned'
    >;

  type HatcheryDragon = {
    id: string;
    clickedOn: string | null;
  };

  type UserSettings = Omit<
    typeof usersSettingsTable.$inferSelect,
    'user_id',
    'flair'
  >;
  type UserRole = typeof usersTable.$inferSelect.role;
  type UserFlair = typeof usersSettingsTable.$inferSelect.flair;
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
