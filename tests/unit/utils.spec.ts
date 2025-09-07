import { describe, expect, it } from 'vitest';
import { formatNumber, formatHoursLeft, pluralise } from '~/utils/index';

describe('Utility Functions', () => {
  describe('formatNumber', () => {
    it('should format numbers with proper locale formatting', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1234567)).toBe('1,234,567');
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(42)).toBe('42');
    });
  });

  describe('formatHoursLeft', () => {
    it('should format hours correctly for values less than 24', () => {
      expect(formatHoursLeft(5)).toBe('5h');
      expect(formatHoursLeft(23)).toBe('23h');
      expect(formatHoursLeft(1, true)).toBe('1 hour');
      expect(formatHoursLeft(5, true)).toBe('5 hours');
    });

    it('should format days and hours correctly for values 24 or greater', () => {
      expect(formatHoursLeft(24)).toBe('1d 0h');
      expect(formatHoursLeft(25)).toBe('1d 1h');
      expect(formatHoursLeft(48)).toBe('2d 0h');
      expect(formatHoursLeft(73)).toBe('3d 1h');
    });

    it('should format full descriptions when full parameter is true', () => {
      expect(formatHoursLeft(25, true)).toBe('1 day and 1 hours');
      expect(formatHoursLeft(48, true)).toBe('2 days and 0 hours');
    });
  });

  describe('pluralise', () => {
    it('should return singular form for count of 1', () => {
      expect(pluralise('hour', 1)).toBe('hour');
      expect(pluralise('dragon', 1)).toBe('dragon');
    });

    it('should return plural form for count other than 1', () => {
      expect(pluralise('hour', 0)).toBe('hours');
      expect(pluralise('hour', 2)).toBe('hours');
      expect(pluralise('dragon', 5)).toBe('dragons');
    });
  });
});
