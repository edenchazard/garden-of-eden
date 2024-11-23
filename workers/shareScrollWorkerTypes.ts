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

export type WorkerResponse = {
  type: WorkerResponseType;
};

export interface WorkerFinished extends WorkerResponse {
  type: WorkerResponseType.jobFinished;
  performanceData: PerformanceData;
  user: User;
}

export interface WorkerError extends WorkerResponse {
  type: WorkerResponseType.error;
  user: User;
}

export type BannerRequestParameters = {
  stats?: 'dragons' | 'garden';
  ext?: '.gif' | '.webp';
};
