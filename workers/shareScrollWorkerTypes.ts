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

export type WorkerInput = {
  user: User;
  filePath: string;
  weeklyClicks: number;
  weeklyRank: number | null;
  allTimeClicks: number;
  allTimeRank: number | null;
  dragons: string[];
  clientSecret: string;
};

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
  user: WorkerInput['user'];
  filePath: WorkerInput['filePath'];
}

export interface WorkerError extends WorkerResponse {
  type: WorkerResponseType.jobFinished;
  user: WorkerInput['user'];
  filePath: WorkerInput['filePath'];
}
