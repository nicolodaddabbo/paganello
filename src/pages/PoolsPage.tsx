import { useState, useEffect, useMemo } from 'react';
import type { PoolStandings } from '../types/pool';
import type { Match } from '../types/match';
import { fetchPools } from '../services/poolsService';
import { fetchSchedule } from '../services/scheduleService';
import { useVisibilityRefresh } from '../hooks/useVisibilityRefresh';
import { useMyTeam } from '../hooks/useMyTeam';
import BracketView from '../components/bracket/BracketView';
import styles from './PoolsPage.module.css';

type Phase = 'pools' | 'crossover' | 'knockout';

const DIVISION_TO_CODE: Record<string, string> = {
  'Real Mixed': 'RM',
  'Loose Mixed': 'LM',
  'Open': 'O',
  'Women': 'W',
  'U20': 'U20',
  'U15': 'U15',
};

function isInitialPool(poolName: string): boolean {
  // POOL A, POOL B, ... single letter
  return /^POOL [A-Z]$/i.test(poolName.trim());
}

function isCrossoverPool(poolName: string): boolean {
  // POOL UA, POOL LB, POOL MA, etc.
  return /^POOL [ULM][A-Z]$/i.test(poolName.trim());
}

function isKnockoutMatch(matchType: string): boolean {
  return /\b(PQ|Q|S|F|R)\d+\b/.test(matchType);
}

export default function PoolsPage() {
  const [poolStandings, setPoolStandings] = useState<PoolStandings[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedDivision, setSelectedDivision] = useState('Real Mixed');
  const [phase, setPhase] = useState<Phase>('pools');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const refreshKey = useVisibilityRefresh();
  const { allFollowed } = useMyTeam();

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPools(), fetchSchedule()])
      .then(([pools, schedule]) => {
        setPoolStandings(pools);
        setMatches(schedule);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const divisions = poolStandings.map(ps => ps.division);
  const allPools = poolStandings.find(ps => ps.division === selectedDivision)?.pools || [];

  const initialPools = useMemo(
    () => allPools.filter(p => isInitialPool(p.poolName)),
    [allPools]
  );

  const crossoverPools = useMemo(
    () => allPools.filter(p => isCrossoverPool(p.poolName)),
    [allPools]
  );

  const divisionCode = DIVISION_TO_CODE[selectedDivision] || '';

  const knockoutMatches = useMemo(
    () => matches.filter(m => m.division === divisionCode && isKnockoutMatch(m.matchType)),
    [matches, divisionCode]
  );

  // Determine which phases are available
  const hasInitialPools = initialPools.length > 0;
  const hasCrossover = crossoverPools.length > 0;
  const hasKnockout = knockoutMatches.length > 0;

  const phases: { key: Phase; label: string; available: boolean }[] = [
    { key: 'pools', label: 'Pools', available: hasInitialPools },
    { key: 'crossover', label: 'Crossover', available: hasCrossover },
    { key: 'knockout', label: 'Knockout', available: hasKnockout },
  ];

  // When switching division, reset to first available phase
  const handleDivisionChange = (div: string) => {
    setSelectedDivision(div);
    setPhase('pools');
  };

  const searchLower = search.toLowerCase();
  const followedSet = useMemo(
    () => new Set(allFollowed.map(t => t.toLowerCase())),
    [allFollowed]
  );

  const isHighlighted = (name: string) => {
    const lower = name.toLowerCase();
    if (searchLower && lower.includes(searchLower)) return true;
    if (!searchLower && followedSet.has(lower)) return true;
    return false;
  };

  // When searching, find which division the team is in and auto-switch
  useEffect(() => {
    if (!searchLower || poolStandings.length === 0) return;
    for (const ps of poolStandings) {
      const found = ps.pools.some(p =>
        p.teams.some(t => t.TEAM.toLowerCase().includes(searchLower))
      );
      if (found && ps.division !== selectedDivision) {
        setSelectedDivision(ps.division);
        setPhase('pools');
        break;
      }
    }
  }, [searchLower, poolStandings]);

  const renderPoolTable = (pools: typeof allPools) => {
    // When searching, only show pools that contain a matching team
    const filtered = searchLower
      ? pools.filter(p => p.teams.some(t => t.TEAM.toLowerCase().includes(searchLower)))
      : pools;

    if (filtered.length === 0) {
      return <p className={styles.empty}>No matching teams</p>;
    }

    return (
      <div className={styles.pools}>
        {filtered.map((pool, i) => (
          <div key={i} className={styles.poolCard}>
            <h3 className={styles.poolName}>{pool.poolName}</h3>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.teamCol}>Team</th>
                    <th>PT</th>
                    <th>W</th>
                    <th>L</th>
                    <th>GD</th>
                  </tr>
                </thead>
                <tbody>
                  {[...pool.teams]
                    .sort((a, b) => b.PT - a.PT)
                    .map((team, j) => (
                      <tr
                        key={j}
                        className={isHighlighted(team.TEAM) ? styles.highlighted : ''}
                      >
                        <td className={styles.teamCell}>{team.TEAM}</td>
                        <td className={styles.num}>{team.PT}</td>
                        <td className={styles.num}>{team.W}</td>
                        <td className={styles.num}>{team.L}</td>
                        <td className={styles.num}>{team.GD > 0 ? `+${team.GD}` : team.GD}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Pool Standings</h1>

      <div className={styles.tabs}>
        {divisions.map(d => (
          <button
            key={d}
            className={`${styles.tab} ${d === selectedDivision ? styles.tabActive : ''}`}
            onClick={() => handleDivisionChange(d)}
          >
            {d}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Find your team..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className={styles.search}
      />

      {!loading && !error && (
        <div className={styles.phaseTabs}>
          {phases.filter(p => p.available).map(p => (
            <button
              key={p.key}
              className={`${styles.phaseTab} ${phase === p.key ? styles.phaseTabActive : ''}`}
              onClick={() => setPhase(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className={styles.skeletons}>
          <div className="skeleton" style={{ height: 200 }} />
          <div className="skeleton" style={{ height: 200 }} />
        </div>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : phase === 'pools' ? (
        initialPools.length === 0 ? (
          <p className={styles.empty}>No pool data available</p>
        ) : (
          renderPoolTable(initialPools)
        )
      ) : phase === 'crossover' ? (
        crossoverPools.length === 0 ? (
          <p className={styles.empty}>No crossover data available</p>
        ) : (
          renderPoolTable(crossoverPools)
        )
      ) : phase === 'knockout' ? (
        knockoutMatches.length === 0 ? (
          <p className={styles.empty}>No knockout matches yet</p>
        ) : (
          <BracketView matches={knockoutMatches} />
        )
      ) : null}
    </div>
  );
}
