import { z } from 'zod';

export type PerformanceData = {
  dragonsIncluded: string[] | null;
  dragonsOmitted: string[] | null;
  statGenTime: number | null; // placing numbers on the base
  dragonFetchTime: number | null; // fetching dragon imgs from server
  dragonGenTime: number | null; // placing dragon imgs on a strip
  frameGenTime: number | null; // generating frames for carousel
  gifGenTime: number | null; // putting it all together and creating the gif
  totalTime: number | null;
  error: unknown; // any error that occurred on the way
};

export type User = {
  id: number;
  username: string;
  flairPath: string | null;
  accessToken?: string | null;
};

export type ScrollStats = {
  female: number;
  male: number;
  adult: number;
  eggs: number;
  hatch: number;
  frozen: number;
  total: number;
};

export const enum BannerType {
  garden = 'garden',
  dragons = 'dragons',
}

export interface WorkerInput {
  stats: BannerType;
  user: User;
  filePath: string;
  dragons: string[];
  secret: string;
  requestParameters: Required<BannerRequestParameters>;
  data: Record<string, number>;
}

export interface BannerDataGardenClicks {
  weeklyClicks: number;
  weeklyRank: number | null;
  allTimeClicks: number;
  allTimeRank: number | null;
}

export const enum WorkerResponseType {
  jobStarted = 'jobStarted',
  jobFinished = 'jobFinished',
  error = 'error',
}

export interface WorkerFinished {
  performanceData: PerformanceData;
}

export const bannerStyles = [
  'default',
  'christmas',
  'aquarium',
  'winter',
  'spring',
  'summer',
  'autumn',
  'seasonal',
  'pacman',
  'stardew',
] as const;

export type BannerStyle = (typeof bannerStyles)[number];
export type SeasonalBannerStyle = 'winter' | 'spring' | 'summer' | 'autumn';
export type StaticBannerStyle = Exclude<BannerStyle, 'seasonal'>;

type BannerPalette = {
  labelColour: string;
  valueColour: string;
  usernameColour: string;
};

export const defaultPalette: Record<StaticBannerStyle, BannerPalette> = {
  default: {
    labelColour: '#dff6f5',
    valueColour: '#f2bd59',
    usernameColour: '#dff6f5',
  },
  christmas: {
    labelColour: '#ffffff',
    valueColour: '#94edff',
    usernameColour: '#ffffff',
  },
  aquarium: {
    labelColour: '#ffffff',
    valueColour: '#f2bd59',
    usernameColour: '#ffffff',
  },
  winter: {
    labelColour: '#eef6ff',
    valueColour: '#7dd3fc',
    usernameColour: '#ffffff',
  },
  spring: {
    labelColour: '#ffffff',
    valueColour: '#ffe0e8',
    usernameColour: '#fff7d6',
  },
  summer: {
    labelColour: '#225923',
    valueColour: '#ffea00',
    usernameColour: '#eeff00',
  },
  autumn: {
    labelColour: '#633313',
    valueColour: '#940000',
    usernameColour: '#945b00',
  },
  pacman: {
    labelColour: '#ffff00',
    valueColour: '#ff0000',
    usernameColour: '#ffff00',
  },
  stardew: {
    labelColour: '#835532',
    valueColour: '#533c13',
    usernameColour: '#000000',
  },
};

export function getCurrentSeason(date = new Date()): SeasonalBannerStyle {
  const month = date.getMonth();

  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';

  return 'winter';
}

export function resolveBannerStyle(
  style: BannerStyle,
  date = new Date()
): StaticBannerStyle {
  return style === 'seasonal' ? getCurrentSeason(date) : style;
}

export function getDefaultBannerPalette(style: BannerStyle, date = new Date()) {
  return defaultPalette[resolveBannerStyle(style, date)];
}

const hexValue = z.string().regex(/^#[0-9a-f]{6}$/);

export const querySchema = z
  .object({
    ext: z.union([z.literal('.gif'), z.literal('.webp')]).default('.webp'),
    stats: z
      .union([z.literal('dragons'), z.literal('garden')])
      .default('garden'),
    style: z.enum(bannerStyles).default('default'),
    usernameColour: hexValue.optional(),
    labelColour: hexValue.optional(),
    valueColour: hexValue.optional(),
  })
  .transform((data) => ({
    ...getDefaultBannerPalette(data.style),
    ...data,
  }));

export type BannerRequestParameters = z.infer<typeof querySchema>;
