import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DragonData } from '~~/types/DragonTypes';

// ─── Hoisted mock state ───────────────────────────────────────────────────────
// vi.hoisted runs before module mocks, so these references can be used inside
// the vi.mock() factory functions below.
const mocks = vi.hoisted(() => {
  const capturedDeletes: string[][] = [];
  const capturedUpdates: Array<{
    set: Record<string, unknown>;
    codes: string[];
  }> = [];
  const capturedInserts: unknown[][] = [];

  const mockSelectFrom = vi.fn();
  const mockFetch = vi.fn();
  const mockQueueAdd = vi.fn().mockResolvedValue(undefined);
  const mockStorageRemoveItem = vi.fn().mockResolvedValue(undefined);

  const db = {
    select: vi.fn(() => ({ from: mockSelectFrom })),
    delete: vi.fn(() => ({
      where: vi.fn((expr: any) => {
        const values: string[] = expr?.__values ?? [];
        capturedDeletes.push(values);
        return Promise.resolve([{ affectedRows: values.length }]);
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn((setValues: Record<string, unknown>) => ({
        where: vi.fn((expr: any) => {
          capturedUpdates.push({ set: setValues, codes: expr?.__values ?? [] });
          return Promise.resolve([{}]);
        }),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn((vals: unknown[]) => {
        capturedInserts.push(vals);
        return Promise.resolve([{}]);
      }),
    })),
  };

  return {
    db,
    capturedDeletes,
    capturedUpdates,
    capturedInserts,
    mockSelectFrom,
    mockFetch,
    mockQueueAdd,
    mockStorageRemoveItem,
  };
});

// ─── Module mocks ─────────────────────────────────────────────────────────────
vi.mock('~~/server/db', () => ({ db: mocks.db }));

vi.mock('~~/server/utils/dragCaveFetch', () => ({
  dragCaveFetch: () => mocks.mockFetch,
}));

vi.mock('~~/server/queue', () => ({
  blockedApiQueue: { add: mocks.mockQueueAdd },
}));

// Replace inArray with a transparent wrapper so our db mocks can inspect the
// array of codes that was passed to each WHERE clause.
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  return {
    ...actual,
    inArray: vi.fn((_col: unknown, values: unknown[]) => ({
      __values: values,
    })),
  };
});

// ─── Module under test ────────────────────────────────────────────────────────
import { cleanUp } from '~~/server/clean-up';

// ─── Test helpers ─────────────────────────────────────────────────────────────
type HatcheryDragon = {
  id: string;
  userId: number;
  inSeedTray: boolean;
  inGarden: boolean;
  isIncubated: boolean;
  isStunned: boolean;
};

function makeHatcheryDragon(
  overrides: Partial<HatcheryDragon> = {}
): HatcheryDragon {
  return {
    id: 'AAAAA',
    userId: 1,
    inSeedTray: false,
    inGarden: true,
    isIncubated: false,
    isStunned: false,
    ...overrides,
  };
}

function makeApiDragon(overrides: Partial<DragonData> = {}): DragonData {
  return {
    id: 'AAAAA',
    name: null,
    owner: 'user',
    start: '2026/01/01',
    hatch: '0',
    grow: '0',
    death: '0',
    views: 100,
    unique: 10,
    clicks: 5,
    gender: '',
    acceptaid: true,
    hoursleft: 50,
    parent_f: '',
    parent_m: '',
    ...overrides,
  };
}

function makeApiResponse(dragons: DragonData[]): {
  errors: unknown[];
  dragons: Record<string, DragonData>;
} {
  return {
    errors: [],
    dragons: Object.fromEntries(dragons.map((d) => [d.id, d])),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('cleanUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.capturedDeletes.length = 0;
    mocks.capturedUpdates.length = 0;
    mocks.capturedInserts.length = 0;
    mocks.mockQueueAdd.mockResolvedValue(undefined);
    mocks.mockStorageRemoveItem.mockResolvedValue(undefined);
    vi.stubGlobal('useRuntimeConfig', () => ({ clientSecret: 'test-secret' }));
    vi.stubGlobal('useStorage', () => ({
      removeItem: mocks.mockStorageRemoveItem,
    }));
  });

  // ─── Hatchery removal ──────────────────────────────────────────────────────
  describe('hatchery removal', () => {
    it('removes a dragon that is missing from the API response', async () => {
      mocks.mockSelectFrom.mockResolvedValue([
        makeHatcheryDragon({ id: 'BLOCK' }),
      ]);
      mocks.mockFetch.mockResolvedValue(makeApiResponse([]));

      await cleanUp();

      expect(mocks.capturedDeletes.flat()).toContain('BLOCK');
    });

    it('queues a blocked-API check for the owner when their dragon is missing from the API response', async () => {
      mocks.mockSelectFrom.mockResolvedValue([
        makeHatcheryDragon({ id: 'BLOCK', userId: 42 }),
      ]);
      mocks.mockFetch.mockResolvedValue(makeApiResponse([]));

      await cleanUp();

      expect(mocks.mockQueueAdd).toHaveBeenCalledOnce();
      expect(mocks.mockQueueAdd.mock.calls[0][1]).toMatchObject({ userId: 42 });
    });

    it('removes a dragon with hoursleft < 0', async () => {
      mocks.mockSelectFrom.mockResolvedValue([
        makeHatcheryDragon({ id: 'DEAD1' }),
      ]);
      mocks.mockFetch.mockResolvedValue(
        makeApiResponse([
          makeApiDragon({ id: 'DEAD1', hoursleft: -2, death: '2026/01/01' }),
        ])
      );

      await cleanUp();

      expect(mocks.capturedDeletes.flat()).toContain('DEAD1');
    });

    it('removes a dragon that is neither in the seed tray nor the garden', async () => {
      mocks.mockSelectFrom.mockResolvedValue([
        makeHatcheryDragon({ id: 'NONE1', inSeedTray: false, inGarden: false }),
      ]);
      mocks.mockFetch.mockResolvedValue(
        makeApiResponse([makeApiDragon({ id: 'NONE1', hoursleft: 50 })])
      );

      await cleanUp();

      expect(mocks.capturedDeletes.flat()).toContain('NONE1');
    });

    it('keeps a dragon that is in the seed tray but not the garden', async () => {
      mocks.mockSelectFrom.mockResolvedValue([
        makeHatcheryDragon({ id: 'SEED1', inSeedTray: true, inGarden: false }),
      ]);
      mocks.mockFetch.mockResolvedValue(
        makeApiResponse([makeApiDragon({ id: 'SEED1', hoursleft: 50 })])
      );

      await cleanUp();

      expect(mocks.capturedDeletes.flat()).not.toContain('SEED1');
    });

    it('keeps a dragon that is in the garden but not the seed tray', async () => {
      mocks.mockSelectFrom.mockResolvedValue([
        makeHatcheryDragon({ id: 'GRDN1', inSeedTray: false, inGarden: true }),
      ]);
      mocks.mockFetch.mockResolvedValue(
        makeApiResponse([makeApiDragon({ id: 'GRDN1', hoursleft: 50 })])
      );

      await cleanUp();

      expect(mocks.capturedDeletes.flat()).not.toContain('GRDN1');
    });
  });

  // ─── Seed tray removal ─────────────────────────────────────────────────────
  describe('seed tray removal', () => {
    it('flags a dragon inSeedTray=false when hoursleft exceeds 96', async () => {
      mocks.mockSelectFrom.mockResolvedValue([
        makeHatcheryDragon({ id: 'STRY1', inSeedTray: true, inGarden: true }),
      ]);
      mocks.mockFetch.mockResolvedValue(
        makeApiResponse([makeApiDragon({ id: 'STRY1', hoursleft: 100 })])
      );

      await cleanUp();

      const update = mocks.capturedUpdates.find(
        (u) => u.set.inSeedTray === false
      );
      expect(update).toBeDefined();
      expect(update!.codes).toContain('STRY1');
    });

    it('does not remove a dragon from the seed tray when hoursleft is exactly 96', async () => {
      mocks.mockSelectFrom.mockResolvedValue([
        makeHatcheryDragon({ id: 'STRY2', inSeedTray: true, inGarden: true }),
      ]);
      mocks.mockFetch.mockResolvedValue(
        makeApiResponse([makeApiDragon({ id: 'STRY2', hoursleft: 96 })])
      );

      await cleanUp();

      expect(
        mocks.capturedUpdates.filter((u) => u.set.inSeedTray === false)
      ).toHaveLength(0);
    });

    it('keeps a seed-tray dragon with hoursleft > 96 in the hatchery because it is still in the garden', async () => {
      mocks.mockSelectFrom.mockResolvedValue([
        makeHatcheryDragon({ id: 'STRY3', inSeedTray: true, inGarden: true }),
      ]);
      mocks.mockFetch.mockResolvedValue(
        makeApiResponse([makeApiDragon({ id: 'STRY3', hoursleft: 100 })])
      );

      await cleanUp();

      expect(mocks.capturedDeletes.flat()).not.toContain('STRY3');
    });
  });

  // ─── Incubated / stunned flags ─────────────────────────────────────────────
  describe('incubated / stunned flags', () => {
    it('marks an egg as incubated when its start date is later than the predicted start', async () => {
      // A far-future start date ensures predictedStartTime < startDate regardless of when the
      // test runs, so isIncubated() reliably returns true.
      mocks.mockSelectFrom.mockResolvedValue([
        makeHatcheryDragon({ id: 'EGG01', isIncubated: false, inGarden: true }),
      ]);
      mocks.mockFetch.mockResolvedValue(
        makeApiResponse([
          makeApiDragon({
            id: 'EGG01',
            hoursleft: 50,
            start: '2099/01/01',
            hatch: '0',
            grow: '0',
          }),
        ])
      );

      await cleanUp();

      const update = mocks.capturedUpdates.find(
        (u) => u.set.isIncubated === true
      );
      expect(update).toBeDefined();
      expect(update!.codes).toContain('EGG01');
    });

    it('marks a hatchling as stunned when its hatch date is earlier than the predicted hatch', async () => {
      // A far-past hatch date ensures predictedStartTime > hatchDate regardless of when the
      // test runs, so isStunned() reliably returns true.
      mocks.mockSelectFrom.mockResolvedValue([
        makeHatcheryDragon({ id: 'HTCH1', isStunned: false, inGarden: true }),
      ]);
      mocks.mockFetch.mockResolvedValue(
        makeApiResponse([
          makeApiDragon({
            id: 'HTCH1',
            hoursleft: 50,
            hatch: '2020/01/01',
            grow: '0',
          }),
        ])
      );

      await cleanUp();

      const update = mocks.capturedUpdates.find(
        (u) => u.set.isStunned === true
      );
      expect(update).toBeDefined();
      expect(update!.codes).toContain('HTCH1');
    });

    it('does not mark isIncubated for a dragon that is already queued for removal', async () => {
      // hoursleft < 0 puts the dragon in removeFromHatchery; the guard must prevent the
      // isIncubated update even though isIncubated() would return true for this egg.
      mocks.mockSelectFrom.mockResolvedValue([
        makeHatcheryDragon({ id: 'EGG02', isIncubated: false, inGarden: true }),
      ]);
      mocks.mockFetch.mockResolvedValue(
        makeApiResponse([
          makeApiDragon({
            id: 'EGG02',
            hoursleft: -2,
            start: '2099/01/01',
            hatch: '0',
            grow: '0',
            death: '2026/01/01',
          }),
        ])
      );

      await cleanUp();

      expect(
        mocks.capturedUpdates.find((u) => u.set.isIncubated === true)
      ).toBeUndefined();
    });

    it('does not mark isStunned for a dragon that is already queued for removal', async () => {
      mocks.mockSelectFrom.mockResolvedValue([
        makeHatcheryDragon({ id: 'HTCH2', isStunned: false, inGarden: true }),
      ]);
      mocks.mockFetch.mockResolvedValue(
        makeApiResponse([
          makeApiDragon({
            id: 'HTCH2',
            hoursleft: -2,
            hatch: '2020/01/01',
            grow: '0',
            death: '2026/01/01',
          }),
        ])
      );

      await cleanUp();

      expect(
        mocks.capturedUpdates.find((u) => u.set.isStunned === true)
      ).toBeUndefined();
    });
  });

  // ─── Stat recording ────────────────────────────────────────────────────────
  describe('stat recording', () => {
    it('records the number of successfully removed dragons', async () => {
      mocks.mockSelectFrom.mockResolvedValue([
        makeHatcheryDragon({ id: 'DEL01', inSeedTray: false, inGarden: false }),
        makeHatcheryDragon({ id: 'KEEP1', inSeedTray: false, inGarden: true }),
      ]);
      mocks.mockFetch.mockResolvedValue(
        makeApiResponse([
          makeApiDragon({ id: 'DEL01', hoursleft: 50 }),
          makeApiDragon({ id: 'KEEP1', hoursleft: 50 }),
        ])
      );

      await cleanUp();

      const [recording] = mocks.capturedInserts[0] as [{ value: number }];
      expect(recording.value).toBe(1);
    });

    it('counts adults, hatchlings, and eggs correctly', async () => {
      mocks.mockSelectFrom.mockResolvedValue([
        makeHatcheryDragon({ id: 'ADL01', inGarden: true }),
        makeHatcheryDragon({ id: 'EGG01', inGarden: true }),
        makeHatcheryDragon({ id: 'HCH01', inGarden: true }),
      ]);
      mocks.mockFetch.mockResolvedValue(
        makeApiResponse([
          // adult: grow !== '0'
          makeApiDragon({
            id: 'ADL01',
            grow: '2026/01/01',
            death: '0',
            hoursleft: 50,
          }),
          // egg: grow === '0', hatch === '0', death === '0'
          makeApiDragon({
            id: 'EGG01',
            grow: '0',
            hatch: '0',
            death: '0',
            hoursleft: 50,
          }),
          // hatchling: grow === '0', hatch !== '0', death === '0'
          makeApiDragon({
            id: 'HCH01',
            grow: '0',
            hatch: '2026/03/20',
            death: '0',
            hoursleft: 50,
          }),
        ])
      );

      await cleanUp();

      const [recording] = mocks.capturedInserts[0] as [
        { extra: Record<string, number> },
      ];
      expect(recording.extra.adults).toBe(1);
      expect(recording.extra.eggs).toBe(1);
      expect(recording.extra.hatchlings).toBe(1);
    });

    it('counts dead dragons correctly', async () => {
      mocks.mockSelectFrom.mockResolvedValue([
        makeHatcheryDragon({ id: 'DED01', inGarden: true }),
      ]);
      mocks.mockFetch.mockResolvedValue(
        makeApiResponse([
          makeApiDragon({
            id: 'DED01',
            grow: '0',
            death: '2026/01/01',
            hoursleft: -2,
          }),
        ])
      );

      await cleanUp();

      const [recording] = mocks.capturedInserts[0] as [
        { extra: Record<string, number> },
      ];
      expect(recording.extra.dead).toBe(1);
    });

    it('does not queue a blocked-API check when all dragons are present in the API response', async () => {
      mocks.mockSelectFrom.mockResolvedValue([
        makeHatcheryDragon({ id: 'OK001' }),
      ]);
      mocks.mockFetch.mockResolvedValue(
        makeApiResponse([makeApiDragon({ id: 'OK001', hoursleft: 50 })])
      );

      await cleanUp();

      expect(mocks.mockQueueAdd).not.toHaveBeenCalled();
    });
  });
});
