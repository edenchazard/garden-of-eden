import { describe, expect, it } from 'vitest';
import {
  usersTable,
  usersSettingsTable,
  userSettingsSchema,
} from '~/database/schema';

describe('Database Schema', () => {
  describe('usersTable', () => {
    it('should have correct table structure', () => {
      expect(usersTable).toBeDefined();
      expect(usersTable.id).toBeDefined();
      expect(usersTable.username).toBeDefined();
      expect(usersTable.role).toBeDefined();
      expect(usersTable.registeredOn).toBeDefined();
      expect(usersTable.money).toBeDefined();
    });
  });

  describe('usersSettingsTable', () => {
    it('should have correct table structure', () => {
      expect(usersSettingsTable).toBeDefined();
      expect(usersSettingsTable.userId).toBeDefined();
      expect(usersSettingsTable.gardenFrequency).toBeDefined();
      expect(usersSettingsTable.gardenPerPage).toBeDefined();
      expect(usersSettingsTable.scrollLayout).toBeDefined();
    });
  });

  describe('userSettingsSchema', () => {
    it('should validate default user settings', () => {
      const defaultSettings = {
        gardenFrequency: 30,
        gardenPerPage: 50,
        seedTrayFrequency: 30,
        seedTrayPerPage: 50,
        sort: 'Youngest First' as const,
        scrollLayout: 'card' as const,
        hatchlingMinAge: 0,
        eggMinAge: 0,
        showScrollRatio: true,
        autoSeedTray: true,
        siteName: 'Eden' as const,
        highlightClickedDragons: true,
        anonymiseStatistics: false,
        sectionOrder: 'hatchlings,eggs' as const,
        bubblewrap: false,
        newReleaseAlerts: true,
      };

      const result = userSettingsSchema.safeParse(defaultSettings);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.gardenFrequency).toBe(30);
        expect(result.data.scrollLayout).toBe('card');
        expect(result.data.siteName).toBe('Eden');
      }
    });

    it('should reject invalid settings', () => {
      const invalidSettings = {
        gardenFrequency: 5, // Too low (min is 15)
        gardenPerPage: 1000, // Too high (max is 500)
        hatchlingMinAge: 100, // Too high (max is 72)
        sort: 'Invalid Sort' as const,
      };

      const result = userSettingsSchema.safeParse(invalidSettings);
      expect(result.success).toBe(false);
    });
  });
});
