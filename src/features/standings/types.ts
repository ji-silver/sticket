export interface KboStanding {
  teamId: string;
  teamName: string;
  rank: number;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number | null;
  gamesBehind: number | null;
}

export interface KboStandingsSnapshot {
  season: number;
  asOfDate: string;
  standings: KboStanding[];
}
