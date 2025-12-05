export type DragonData = {
  id: string;
  name: string | null;
  owner: string | null;
  start: string;
  hatch: string;
  grow: string;
  death: string;
  views: number;
  unique: number;
  clicks: number;
  gender: 'Male' | 'Female' | '';
  acceptaid: boolean;
  hoursleft: number;
  parent_f: string;
  parent_m: string;
};

export interface DragonAttributes {
  dead: boolean;
  hidden: boolean;
  frozen: boolean;
}
