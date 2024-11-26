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

export const defaultPalette = {
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
};

const hexValue = z.string().regex(/^#[0-9a-f]{6}$/);

export const querySchema = z
  .object({
    ext: z.union([z.literal('.gif'), z.literal('.webp')]).default('.gif'),
    stats: z
      .union([z.literal('dragons'), z.literal('garden')])
      .default('garden'),
    style: z
      .union([z.literal('default'), z.literal('christmas')])
      .default('default'),
    usernameColour: hexValue.optional(),
    labelColour: hexValue.optional(),
    valueColour: hexValue.optional(),
  })
  .transform((data) => ({
    ...defaultPalette[data.style],
    ...data,
  }));

export type BannerRequestParameters = z.infer<typeof querySchema>;
