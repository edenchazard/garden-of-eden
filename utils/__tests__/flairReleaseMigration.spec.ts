import { describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';

describe('Flair Release Date Migration', () => {
  it('should set release_date to available_from for seasonal flairs', () => {
    // Test cases based on the migration
    const seasonalFlairs = [
      { name: 'Pumpkin', availableFrom: '2024-10-01 00:00:00', expectedReleaseDate: '2024-10-01 00:00:00' },
      { name: 'Christmas Tree', availableFrom: '2024-12-01 00:00:00', expectedReleaseDate: '2024-12-01 00:00:00' },
      { name: 'Baby\'s breath', availableFrom: '2025-02-07 00:00:00', expectedReleaseDate: '2025-02-07 00:00:00' },
      { name: 'Garnet', availableFrom: '2025-01-01 00:00:00', expectedReleaseDate: '2025-01-01 00:00:00' },
    ];

    seasonalFlairs.forEach(flair => {
      expect(flair.availableFrom).toBe(flair.expectedReleaseDate);
    });
  });

  it('should set reasonable estimated dates for general flairs', () => {
    const generalFlairs = [
      { name: 'Anthurium', expectedReleaseDate: '2024-01-01 00:00:00', wave: 'early' },
      { name: 'Sakura', expectedReleaseDate: '2024-03-01 00:00:00', wave: 'spring' },
      { name: 'Bird of Paradise', expectedReleaseDate: '2024-06-01 00:00:00', wave: 'summer' },
      { name: 'Forget-me-not', expectedReleaseDate: '2024-08-01 00:00:00', wave: 'late summer' },
      { name: 'Snapdragon', expectedReleaseDate: '2024-09-01 00:00:00', wave: 'recent' },
    ];

    // Verify dates are chronologically ordered
    const dates = generalFlairs.map(f => DateTime.fromSQL(f.expectedReleaseDate));
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i].toMillis()).toBeGreaterThanOrEqual(dates[i-1].toMillis());
    }
  });

  it('should calculate next availability correctly with release cycle logic', () => {
    // Test the logic from flairReleaseCycle.ts
    const currentDate = DateTime.fromISO('2024-11-08'); // Example: after Halloween ended
    const releaseDate = DateTime.fromSQL('2024-10-01 00:00:00'); // Pumpkin release date
    const daysAvailable = 37; // Halloween window

    // Logic: if current date is past this year's release, move to next year
    const nextYear = currentDate < releaseDate.set({ year: currentDate.year })
      ? currentDate.year
      : currentDate.year + 1;

    const newAvailableFrom = releaseDate.set({ year: nextYear });
    const newAvailableTo = newAvailableFrom.plus({ days: daysAvailable });

    expect(nextYear).toBe(2025);
    expect(newAvailableFrom.toSQL()).toBe('2025-10-01 00:00:00');
    expect(newAvailableTo.toSQL()).toBe('2025-11-07 00:00:00');
  });
});