import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Match, Filters } from '../types/match';
import { fetchSchedule, getUniqueTeams, getUniqueFields, getFlags, onScheduleUpdate } from '../services/scheduleService';
import { filterMatches, getDefaultFilters } from '../utils/filters';
import { getNextMatch, getTeamMatches, getTodayString, getDayLabel, formatTime, DAYS } from '../utils/time';
import { useLocalStorage } from '../utils/localStorage';
import { useMyTeam } from '../hooks/useMyTeam';
import { useVisibilityRefresh } from '../hooks/useVisibilityRefresh';
import NextGameHero from '../components/home/NextGameHero';
import TeamDaySchedule from '../components/home/TeamDaySchedule';
import TeamPrompt from '../components/home/TeamPrompt';
import FaberEasterEgg from '../components/home/FaberEasterEgg';
import FilterBar from '../components/schedule/FilterBar';
import MatchCard from '../components/schedule/MatchCard';
import { Link } from 'react-router-dom';
import styles from './HomePage.module.css';

const FABER_TRIGGER = '7 cloni di faber';

const INITIAL_SHOW = 75;
const LOAD_MORE = 75;

export default function HomePage() {
  const { myTeam, setMyTeam, hasChosenMode, dismissPrompt, allFollowed, isFollowed } = useMyTeam();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState(getTodayString());

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
      })
      .catch(() => { })
      .finally(() => setLoading(false));
    return onScheduleUpdate(setMatches);
  }, [refreshKey]);

  const teams = useMemo(() => getUniqueTeams(matches), [matches]);
  const nextMatch = useMemo(() => myTeam ? getNextMatch(matches, myTeam) : null, [matches, myTeam]);
  const teamMatches = useMemo(() => myTeam ? getTeamMatches(matches, myTeam) : [], [matches, myTeam]);

  const availableFields = useMemo(() => getUniqueFields(matches), [matches]);
  const availableCountries = useMemo(() => {
    const flags = getFlags();
    const unique = new Set(Object.values(flags).filter(Boolean));
    return Array.from(unique).sort();
  }, [matches]);

  const baseFiltered = useMemo(() => {
    return filterMatches(matches, filters, allFollowed, showMyGamesOnly);
  }, [matches, filters, showMyGamesOnly, allFollowed]);

  const filteredMatches = useMemo(
    () => selectedDay === 'all' ? baseFiltered : baseFiltered.filter(m => m.day === selectedDay),
    [baseFiltered, selectedDay]
  );

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

  const faberActive = filters.search.trim().toLowerCase() === FABER_TRIGGER;

  const handleSelectTeam = (team: string) => {
    setMyTeam(team);
    setShowTeamPicker(false);
  };

  return (
    <div className={styles.page}>
      {faberActive && <FaberEasterEgg onClose={clearFilters} />}
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

      {/* Schedule */}
      <div className={styles.scheduleSection}>
        <div className={styles.header}>
          <h2 className={styles.title}>{myTeam ? 'All Matches' : 'Schedule'}</h2>
          <Link to="/map" className={styles.mapBtn}>Map</Link>
        </div>

        {/* Day tabs */}
        <div className={styles.dayTabs}>
          {DAYS.map(d => (
            <button
              key={d}
              className={`${styles.dayTab} ${d === selectedDay ? styles.dayTabActive : ''}`}
              onClick={() => setSelectedDay(d)}
            >
              {getDayLabel(d)}
            </button>
          ))}
          <button
            className={`${styles.dayTab} ${selectedDay === 'all' ? styles.dayTabActive : ''}`}
            onClick={() => setSelectedDay('all')}
          >
            All
          </button>
        </div>

        {/* Quick toggles */}
        <div className={styles.toggleRow}>
          <FilterBar
            filters={filters}
            updateFilter={updateFilter}
            clearFilters={clearFilters}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            availableFields={availableFields}
            availableCountries={availableCountries}
            myTeamsOnly={showMyGamesOnly}
            setMyTeamsOnly={setShowMyGamesOnly}
            hasFollowed={allFollowed.length > 0}
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
