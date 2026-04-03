import type { Match, Filters } from '../types/match';
import { getFlag } from '../services/scheduleService';

export function filterMatches(
  matches: Match[],
  filters: Filters,
  favoriteTeams: string[],
  showFavoritesOnly: boolean
): Match[] {
  return matches.filter(match => {
    // Team search filter (case-insensitive)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const team1Lower = match.team1.toLowerCase();
      const team2Lower = match.team2.toLowerCase();
      if (!team1Lower.includes(searchLower) && !team2Lower.includes(searchLower)) {
        return false;
      }
    }

    // Field filter
    if (filters.field !== 'all' && match.field !== filters.field) {
      return false;
    }

    // Day filter
    if (filters.day !== 'all' && match.day !== filters.day) {
      return false;
    }

    // Division filter
    if (filters.division !== 'all' && match.division !== filters.division) {
      return false;
    }

    // Time filter
    if (filters.time !== 'all' && match.time !== filters.time) {
      return false;
    }

    // Status filter
    if (filters.status !== 'all') {
      if (filters.status === 'played' && !match.hasScore) {
        return false;
      }
      if (filters.status === 'upcoming' && match.hasScore) {
        return false;
      }
    }

    // Country filter
    if (filters.country !== 'all') {
      const t1Flag = getFlag(match.team1);
      const t2Flag = getFlag(match.team2);
      if (t1Flag !== filters.country && t2Flag !== filters.country) {
        return false;
      }
    }

    // Favorites filter
    if (showFavoritesOnly) {
      if (!favoriteTeams.includes(match.team1) && !favoriteTeams.includes(match.team2)) {
        return false;
      }
    }

    return true;
  });
}

export function getActiveFilterCount(filters: Filters): number {
  let count = 0;
  if (filters.search) count++;
  if (filters.field !== 'all') count++;
  if (filters.day !== 'all') count++;
  if (filters.division !== 'all') count++;
  if (filters.time !== 'all') count++;
  if (filters.status !== 'all') count++;
  if (filters.country !== 'all') count++;
  return count;
}

export function getDefaultFilters(): Filters {
  return {
    search: '',
    field: 'all',
    day: 'all',
    division: 'all',
    time: 'all',
    status: 'all',
    country: 'all',
  };
}
