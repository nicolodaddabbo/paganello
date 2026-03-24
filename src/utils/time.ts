import type { Match } from '../types/match';

// Tournament dates: April 4-6, 2026
const TOURNAMENT_DATES: Record<string, string> = {
  saturday: '2026-04-04',
  sunday: '2026-04-05',
  monday: '2026-04-06',
};

export const DAYS = ['saturday', 'sunday', 'monday'] as const;

const FALLBACK_GAME_DURATION_MINUTES = 45;

export function getMatchDate(match: Match): Date {
  const dateStr = TOURNAMENT_DATES[match.day];
  if (!dateStr) return new Date(0);
  const timeMatch = match.time.match(/^(\d{1,2}):(\d{2})/);
  if (!timeMatch) return new Date(0);
  const hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const date = new Date(`${dateStr}T00:00:00`);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function getMatchEndDate(match: Match): Date {
  const dateStr = TOURNAMENT_DATES[match.day];
  if (!dateStr) return new Date(0);
  // Extract end time from slot like "11:00 - 11-11:45" → last HH:MM
  const endMatch = match.time.match(/(\d{1,2}):(\d{2})\s*$/);
  if (endMatch) {
    const date = new Date(`${dateStr}T00:00:00`);
    date.setHours(parseInt(endMatch[1], 10), parseInt(endMatch[2], 10), 0, 0);
    return date;
  }
  const start = getMatchDate(match);
  return new Date(start.getTime() + FALLBACK_GAME_DURATION_MINUTES * 60 * 1000);
}

export type MatchStatus = 'upcoming' | 'live' | 'completed';

export function getMatchStatus(match: Match): MatchStatus {
  if (match.hasScore) return 'completed';

  const now = new Date();
  const start = getMatchDate(match);
  const end = getMatchEndDate(match);

  if (now >= start && now <= end) return 'live';
  if (now > end) return 'completed';
  return 'upcoming';
}

export function getRelativeTime(date: Date): string {
  if (!date || isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (Math.abs(diffMin) < 1) return 'now';

  if (diffMin > 0) {
    if (diffMin < 60) return `in ${diffMin}m`;
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    if (hours < 24) return mins > 0 ? `in ${hours}h ${mins}m` : `in ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days > 30) return '';
    return `in ${days}d`;
  }

  const absDiff = Math.abs(diffMin);
  if (absDiff < 60) return `${absDiff}m ago`;
  const hours = Math.floor(absDiff / 60);
  const mins = absDiff % 60;
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}m ago` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days > 30) return '';
  return `${days}d ago`;
}

export function getNextMatch(matches: Match[], teamName: string): Match | null {
  const now = new Date();
  const lower = teamName.toLowerCase();
  const teamMatches = matches
    .filter(m => m.team1.toLowerCase() === lower || m.team2.toLowerCase() === lower)
    .map(m => ({ match: m, date: getMatchDate(m), status: getMatchStatus(m) }));

  // First check for live games
  const live = teamMatches.find(m => m.status === 'live');
  if (live) return live.match;

  // Then find next upcoming (already sorted by transform order)
  const upcoming = teamMatches.find(m => m.date > now && m.status === 'upcoming');
  return upcoming?.match ?? null;
}

export function getTeamMatches(matches: Match[], teamName: string): Match[] {
  const lower = teamName.toLowerCase();
  // matches are already in chronological order from transformScheduleData
  return matches.filter(m =>
    m.team1.toLowerCase() === lower || m.team2.toLowerCase() === lower
  );
}

export interface MatchPerspective {
  opponent: string;
  myScore: number;
  oppScore: number;
}

export function getMatchPerspective(match: Match, myTeam: string): MatchPerspective {
  const isTeam1 = match.team1.toLowerCase() === myTeam.toLowerCase();
  return {
    opponent: isTeam1 ? match.team2 : match.team1,
    myScore: isTeam1 ? match.score1 : match.score2,
    oppScore: isTeam1 ? match.score2 : match.score1,
  };
}

export function getTodayString(): string {
  const now = new Date();
  // Only map to tournament days during the actual tournament (April 4-6, 2026)
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (dateStr === '2026-04-04') return 'saturday';
  if (dateStr === '2026-04-05') return 'sunday';
  if (dateStr === '2026-04-06') return 'monday';
  // Outside tournament dates, default to first day
  return 'saturday';
}

export function getDayLabel(day: string): string {
  const labels: Record<string, string> = {
    saturday: 'Sat 4 Apr',
    sunday: 'Sun 5 Apr',
    monday: 'Mon 6 Apr',
  };
  return labels[day] || day;
}

/** Extract clean start time from slot like "09:00 - 09-09:45" → "09:00" */
export function formatTime(time: string): string {
  const m = time.match(/^(\d{1,2}:\d{2})/);
  return m ? m[1] : time;
}
