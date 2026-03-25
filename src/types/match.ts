export interface RawMatchData {
  field: string;
  matchType: string;
  team1: string;
  team2: string;
  score1: number;
  score2: number;
}

export type FlagMap = Record<string, string>;

export interface RawScheduleData {
  saturday: {
    [time: string]: RawMatchData[];
  };
  sunday: {
    [time: string]: RawMatchData[];
  };
  monday: {
    [time: string]: RawMatchData[];
  };
  flags: FlagMap;
}

export interface Match {
  id: string;
  day: 'saturday' | 'sunday' | 'monday';
  time: string;
  field: string;
  division: string;
  matchType: string;
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  hasScore: boolean;
}

export type DayFilter = 'all' | 'saturday' | 'sunday' | 'monday';
export type DivisionFilter = 'all' | 'RM' | 'LM' | 'O' | 'W' | 'U20' | 'U15';
export type StatusFilter = 'all' | 'played' | 'upcoming';

export interface Filters {
  search: string;
  field: string;
  day: DayFilter;
  division: DivisionFilter;
  time: string;
  status: StatusFilter;
}
