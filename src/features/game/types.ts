export interface KboGame {
  id: string;
  date: string;
  time: string;
  stadiumName: string;
  awayTeamName: string;
  homeTeamName: string;
  awayScore: number | null;
  homeScore: number | null;
}

export interface TeamCalendarGame {
  id: string;
  date: string;
  time: string;
  stadiumName: string;
  homeAway: 'H' | 'A';
  opponentName: string;
  status: string;
  awayScore: number | null;
  homeScore: number | null;
}
