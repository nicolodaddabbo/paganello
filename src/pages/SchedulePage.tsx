import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Match, Filters } from '../types/match';
import { fetchSchedule, getUniqueFields, getUniqueTimes } from '../services/scheduleService';
import { filterMatches, getDefaultFilters } from '../utils/filters';
import { useLocalStorage, useLocalStorageBoolean } from '../utils/localStorage';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import FilterBar from '../components/schedule/FilterBar';
import FavoritesBar from '../components/schedule/FavoritesBar';
import MatchCard from '../components/schedule/MatchCard';
import styles from '../styles/Schedule.module.css';

export default function SchedulePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useLocalStorage<Filters>('paganello-filters', getDefaultFilters());
  const [favoriteTeams, setFavoriteTeams] = useLocalStorage<string[]>('paganello-favorites', []);
  const [showFavoritesOnly, setShowFavoritesOnly] = useLocalStorageBoolean('paganello-show-favorites', false);
  const [showFilters, setShowFilters] = useState(false);

  const [availableFields, setAvailableFields] = useState<string[]>(['all']);
  const [availableTimes, setAvailableTimes] = useState<string[]>(['all']);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSchedule();
      setMatches(data);
      setAvailableFields(getUniqueFields(data));
      setAvailableTimes(getUniqueTimes(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = useCallback((key: keyof Filters, value: string) => {
    setFilters({ ...filters, [key]: value });
  }, [filters, setFilters]);

  const clearFilters = useCallback(() => {
    setFilters(getDefaultFilters());
  }, [setFilters]);

  const toggleFavorite = useCallback((team: string) => {
    if (favoriteTeams.includes(team)) {
      setFavoriteTeams(favoriteTeams.filter(t => t !== team));
    } else {
      setFavoriteTeams([...favoriteTeams, team]);
    }
  }, [favoriteTeams, setFavoriteTeams]);

  const isFavorite = useCallback((team: string) => favoriteTeams.includes(team), [favoriteTeams]);

  const removeFavorite = useCallback((team: string) => {
    setFavoriteTeams(favoriteTeams.filter(t => t !== team));
  }, [favoriteTeams, setFavoriteTeams]);

  const filteredMatches = useMemo(
    () => filterMatches(matches, filters, favoriteTeams, showFavoritesOnly),
    [matches, filters, favoriteTeams, showFavoritesOnly]
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadSchedule} />;

  return (
    <div className={styles.schedulePage}>
      <FilterBar
        filters={filters}
        updateFilter={updateFilter}
        clearFilters={clearFilters}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        availableFields={availableFields}
        availableTimes={availableTimes}
      />

      <FavoritesBar
        favoriteTeams={favoriteTeams}
        removeFavorite={removeFavorite}
        showFavoritesOnly={showFavoritesOnly}
        setShowFavoritesOnly={setShowFavoritesOnly}
      />

      <div className={styles.matchList}>
        {filteredMatches.length === 0 ? (
          <p className={styles.noMatches}>No matches found with current filters.</p>
        ) : (
          <>
            <p className={styles.resultCount}>
              Showing {filteredMatches.length} {filteredMatches.length === 1 ? 'match' : 'matches'}
            </p>
            {filteredMatches.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                isFavorite={isFavorite}
                toggleFavorite={toggleFavorite}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
