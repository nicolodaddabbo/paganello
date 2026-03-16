import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Match, Filters } from '../types/match';
import { fetchSchedule, getUniqueTeams } from '../services/scheduleService';
import { filterMatches, getDefaultFilters } from '../utils/filters';
import { getNextMatch, getTeamMatches, getTodayString, getDayLabel, formatTime, DAYS } from '../utils/time';
import { useLocalStorage } from '../utils/localStorage';
import { useMyTeam } from '../hooks/useMyTeam';
import { useVisibilityRefresh } from '../hooks/useVisibilityRefresh';
import { getCacheTimestamp } from '../utils/cache';
import NextGameHero from '../components/home/NextGameHero';
import TeamDaySchedule from '../components/home/TeamDaySchedule';
import TeamPrompt from '../components/home/TeamPrompt';
import FilterBar from '../components/schedule/FilterBar';
import MatchCard from '../components/schedule/MatchCard';
import styles from './HomePage.module.css';

const INITIAL_SHOW = 30;
const LOAD_MORE = 30;

export default function HomePage() {
  const { myTeam, setMyTeam, hasChosenMode, dismissPrompt, allFollowed, isFollowed } = useMyTeam();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState(getTodayString());
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const [filters, setFilters] = useLocalStorage<Filters>('paganello-filters', getDefaultFilters());
  const [showFilters, setShowFilters] = useState(false);
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>(getTodayString());
  const [visibleCount, setVisibleCount] = useState(INITIAL_SHOW);
  const [showMyGamesOnly, setShowMyGamesOnly] = useLocalStorage<boolean>('paganello-my-games-only', false);

  const refreshKey = useVisibilityRefresh();

  useEffect(() => {
    fetchSchedule()
      .then(data => {
        setMatches(data);
        setLastUpdated(getCacheTimestamp('paganello-schedule'));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const teams = useMemo(() => getUniqueTeams(matches), [matches]);
  const nextMatch = useMemo(() => myTeam ? getNextMatch(matches, myTeam) : null, [matches, myTeam]);
  const teamMatches = useMemo(() => myTeam ? getTeamMatches(matches, myTeam) : [], [matches, myTeam]);

  const stats = useMemo(() => {
    const teamNames = new Set<string>();
    const divisions = new Set<string>();
    matches.forEach(m => {
      if (m.team1 && !/^[A-Z0-9]{1,4}$/.test(m.team1.trim()) && !/^[A-Z]{1,3}\d+$/.test(m.team1.trim())) {
        teamNames.add(m.team1);
      }
      if (m.team2 && !/^[A-Z0-9]{1,4}$/.test(m.team2.trim()) && !/^[A-Z]{1,3}\d+$/.test(m.team2.trim())) {
        teamNames.add(m.team2);
      }
      if (m.division !== 'Unknown') divisions.add(m.division);
    });
    return {
      teams: teamNames.size,
      games: matches.length,
      divisions: divisions.size,
    };
  }, [matches]);

  const availableFields = useMemo(() => {
    const fields = new Set<string>();
    matches.forEach(m => fields.add(m.field));
    return ['all', ...Array.from(fields).sort()];
  }, [matches]);

  const availableTimes = useMemo(() => {
    const times = new Set<string>();
    matches.forEach(m => times.add(m.time));
    return ['all', ...Array.from(times).sort()];
  }, [matches]);

  // Filter pipeline: base filters → my games → day
  const baseFiltered = useMemo(() => {
    let result = filterMatches(matches, filters, [], false);
    if (showMyGamesOnly && allFollowed.length > 0) {
      const lowers = new Set(allFollowed.map(t => t.toLowerCase()));
      result = result.filter(m =>
        lowers.has(m.team1.toLowerCase()) || lowers.has(m.team2.toLowerCase())
      );
    }
    return result;
  }, [matches, filters, showMyGamesOnly, allFollowed]);

  const filteredMatches = useMemo(
    () => selectedDay === 'all' ? baseFiltered : baseFiltered.filter(m => m.day === selectedDay),
    [baseFiltered, selectedDay]
  );

  const dayCounts = useMemo(() => {
    const counts: Record<string, number> = { all: baseFiltered.length };
    DAYS.forEach(d => { counts[d] = baseFiltered.filter(m => m.day === d).length; });
    return counts;
  }, [baseFiltered]);

  // Group matches by time slot
  const groupedMatches = useMemo(() => {
    const groups: { time: string; matches: Match[] }[] = [];
    const visible = filteredMatches.slice(0, visibleCount);
    let currentTime = '';
    for (const match of visible) {
      if (match.time !== currentTime) {
        currentTime = match.time;
        groups.push({ time: match.time, matches: [match] });
      } else {
        groups[groups.length - 1].matches.push(match);
      }
    }
    return groups;
  }, [filteredMatches, visibleCount]);

  const hasMore = filteredMatches.length > visibleCount;

  useEffect(() => { setVisibleCount(INITIAL_SHOW); }, [selectedDay, filters, showMyGamesOnly]);

  const updateFilter = useCallback((key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, [setFilters]);

  const clearFilters = useCallback(() => setFilters(getDefaultFilters()), [setFilters]);

  const handleSelectTeam = (team: string) => {
    setMyTeam(team);
    setShowTeamPicker(false);
  };

  const updatedAgo = lastUpdated
    ? `Updated ${Math.round((Date.now() - lastUpdated) / 60000)}m ago`
    : null;

  return (
    <div className={styles.page}>
      {/* My Team hero */}
      {myTeam && (
        <div className={styles.myTeamSection}>
          <NextGameHero match={nextMatch} myTeam={myTeam} />
          <TeamDaySchedule matches={teamMatches} myTeam={myTeam} day={day} onDayChange={setDay} />
        </div>
      )}

      {/* Team prompt */}
      {!hasChosenMode && !loading && matches.length > 0 && (
        <TeamPrompt
          teams={teams}
          onSelectTeam={handleSelectTeam}
          onDismiss={dismissPrompt}
          expanded={showTeamPicker}
          onExpand={() => setShowTeamPicker(true)}
        />
      )}

      {/* Tournament Stats */}
      {!loading && matches.length > 0 && (
        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{stats.teams}</span>
            <span className={styles.statLabel}>Teams</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{stats.games}</span>
            <span className={styles.statLabel}>Games</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{stats.divisions}</span>
            <span className={styles.statLabel}>Divisions</span>
          </div>
        </div>
      )}

      {/* Schedule */}
      <div className={styles.scheduleSection}>
        <div className={styles.header}>
          <h2 className={styles.title}>{myTeam ? 'All Matches' : 'Schedule'}</h2>
          {updatedAgo && <span className={styles.updated}>{updatedAgo}</span>}
        </div>

        {/* Day tabs */}
        <div className={styles.dayTabs}>
          {DAYS.map(d => (
            <button
              key={d}
              className={`${styles.dayTab} ${d === selectedDay ? styles.dayTabActive : ''}`}
              onClick={() => setSelectedDay(d)}
            >
              <span className={styles.dayLabel}>{getDayLabel(d)}</span>
              <span className={styles.dayCount}>{dayCounts[d] || 0}</span>
            </button>
          ))}
          <button
            className={`${styles.dayTab} ${selectedDay === 'all' ? styles.dayTabActive : ''}`}
            onClick={() => setSelectedDay('all')}
          >
            <span className={styles.dayLabel}>All</span>
            <span className={styles.dayCount}>{dayCounts.all || 0}</span>
          </button>
        </div>

        {/* Quick toggles */}
        <div className={styles.toggleRow}>
          {allFollowed.length > 0 && (
            <button
              className={`${styles.chip} ${showMyGamesOnly ? styles.chipActive : ''}`}
              onClick={() => setShowMyGamesOnly(!showMyGamesOnly)}
            >
              My games
            </button>
          )}
          <FilterBar
            filters={filters}
            updateFilter={updateFilter}
            clearFilters={clearFilters}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            availableFields={availableFields}
            availableTimes={availableTimes}
          />
        </div>

        {loading ? (
          <div className={styles.skeletons}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`skeleton ${styles.matchSkeleton}`} />
            ))}
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className={styles.empty}>
            <p>No matches found</p>
            {(filters.search || filters.division !== 'all' || filters.field !== 'all') && (
              <button className={styles.clearBtn} onClick={clearFilters}>Clear filters</button>
            )}
          </div>
        ) : (
          <>
            {groupedMatches.map(group => (
              <div key={group.time} className={styles.timeGroup}>
                <div className={styles.timeHeader}>{formatTime(group.time)}</div>
                <div className={styles.list}>
                  {group.matches.map(match => (
                    <MatchCard key={match.id} match={match} isFollowed={isFollowed} />
                  ))}
                </div>
              </div>
            ))}
            {hasMore && (
              <button className={styles.loadMore} onClick={() => setVisibleCount(c => c + LOAD_MORE)}>
                Show more ({filteredMatches.length - visibleCount} remaining)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
