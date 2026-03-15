export interface PoolRow {
  TEAM: string;
  PT: number;   // Points
  W: number;    // Wins
  L: number;    // Losses
  P: number;    // Played
  GS: number;   // Goals Scored
  GA: number;   // Goals Against
  GD: number;   // Goal Difference
}

export interface Pool {
  poolName: string;
  teams: PoolRow[];
  standings: number[];
}

export interface RawPoolData {
  'Real Mixed Pools': Pool[];
  'Loose Mixed Pools': Pool[];
  'Open Pools': Pool[];
  'Women Pools': Pool[];
  'U20 Pools': Pool[];
  'U15 Pools': Pool[];
}

export type DivisionKey = 'Real Mixed Pools' | 'Loose Mixed Pools' | 'Open Pools' | 'Women Pools' | 'U20 Pools' | 'U15 Pools';

export interface PoolStandings {
  division: string;
  divisionKey: DivisionKey;
  pools: Pool[];
}
