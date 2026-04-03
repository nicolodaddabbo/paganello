import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMyTeam } from '../hooks/useMyTeam';
import { fetchSchedule, getUniqueTeams, getFlag, onScheduleUpdate } from '../services/scheduleService';
import { fetchPools } from '../services/poolsService';
import type { Match } from '../types/match';
import type { PoolStandings } from '../types/pool';
import { isPlaceholder } from '../utils/match';
import styles from './BracketPage.module.css';

interface BracketStep {
  roundLabel: string;
  matchType: string;
  opponent: string;        // raw placeholder or team name
  opponentResolved: string; // resolved to real team if possible
  outcome: 'win' | 'lose' | 'unknown';
  placement: string;
}

// Build a map: placeholder string → real team name
function buildResolutionMap(
  pools: PoolStandings[],
  matches: Match[],
): Map<string, string> {
  const map = new Map<string, string>();

  // Pool standings: "1A" → team name, "2UA" → team name
  for (const div of pools) {
    for (const pool of div.pools) {
      const key = pool.poolName.replace('POOL ', '');
      pool.teams.forEach((t, i) => {
        const ref = `${i + 1}${key}`;
        if (t.TEAM && !isPlaceholder(t.TEAM)) {
          map.set(ref, t.TEAM);
        }
      });
    }
  }

  // Match results: "WPQ1" → winner, "LPQ1" → loser
  for (const m of matches) {
    if (!m.hasScore || m.score1 === m.score2) continue;
    const code = extractCode(m.matchType);
    if (!code) continue;
    const winner = m.score1 > m.score2 ? m.team1 : m.team2;
    const loser = m.score1 > m.score2 ? m.team2 : m.team1;
    map.set(`W${code}`, winner);
    map.set(`L${code}`, loser);
  }

  return map;
}

function extractCode(matchType: string): string | null {
  const m = matchType.match(/(?:RM|LM|O|W|U20|U15)\s+((?:PQ|Q|S|F|R)\d+)/);
  return m ? m[1] : null;
}

function resolveRef(ref: string, resMap: Map<string, string>): string {
  // Direct lookup
  const direct = resMap.get(ref);
  if (direct) return direct;

  // Try resolving recursively: e.g. WPQ1 → winner of PQ1
  // If WPQ1 isn't in map, try to resolve who played PQ1
  return ref;
}

// Trace a team's path through the bracket
function tracePath(
  teamName: string,
  division: string,
  matches: Match[],
  resMap: Map<string, string>,
): BracketStep[] {
  const divMatches = matches.filter(m =>
    m.division === division && !m.matchType.includes('POOL')
  );
  const lower = teamName.toLowerCase();
  const path: BracketStep[] = [];

  // Build reverse map: real team name → all placeholder refs that resolve to it
  const teamRefs = new Set<string>();
  teamRefs.add(lower);
  for (const [ref, resolved] of resMap) {
    if (resolved.toLowerCase() === lower) {
      teamRefs.add(ref.toLowerCase());
    }
  }

  // Find matches where this team appears (directly or via placeholder)
  for (const m of divMatches) {
    const code = extractCode(m.matchType);
    if (!code) continue;

    const t1 = m.team1;
    const t2 = m.team2;
    const t1Resolved = isPlaceholder(t1) ? resolveRef(t1, resMap) : t1;
    const t2Resolved = isPlaceholder(t2) ? resolveRef(t2, resMap) : t2;

    const isT1 = teamRefs.has(t1.toLowerCase()) || t1Resolved.toLowerCase() === lower;
    const isT2 = teamRefs.has(t2.toLowerCase()) || t2Resolved.toLowerCase() === lower;

    if (!isT1 && !isT2) continue;

    const oppRaw = isT1 ? t2 : t1;
    const oppResolved = isT1 ? t2Resolved : t1Resolved;

    let outcome: 'win' | 'lose' | 'unknown' = 'unknown';
    if (m.hasScore && m.score1 !== m.score2) {
      const myScore = isT1 ? m.score1 : m.score2;
      const oppScore = isT1 ? m.score2 : m.score1;
      outcome = myScore > oppScore ? 'win' : 'lose';

      // Add result refs so we can trace further
      const winRef = `W${code}`;
      const loseRef = `L${code}`;
      if (outcome === 'win') {
        teamRefs.add(winRef.toLowerCase());
      } else {
        teamRefs.add(loseRef.toLowerCase());
      }
    }

    const placementMatch = m.matchType.match(/\(([^)]+)\)/);

    let roundLabel = code;
    if (code.startsWith('PQ')) roundLabel = `Pre-Quarter ${code.slice(2)}`;
    else if (code.startsWith('Q')) roundLabel = `Quarter ${code.slice(1)}`;
    else if (code.startsWith('S')) roundLabel = `Semi ${code.slice(1)}`;
    else if (code.startsWith('F')) roundLabel = `Final ${code.slice(1)}`;
    else if (code.startsWith('R')) roundLabel = `Round ${code.slice(1)}`;

    path.push({
      roundLabel,
      matchType: m.matchType,
      opponent: oppRaw,
      opponentResolved: oppResolved,
      outcome,
      placement: placementMatch ? placementMatch[1] : '',
    });
  }

  return path;
}

function findTeamPool(teamName: string, allPools: PoolStandings[]): { pool: string; division: string; position: number } | null {
  const lower = teamName.toLowerCase();
  for (const division of allPools) {
    for (const pool of division.pools) {
      for (let i = 0; i < pool.teams.length; i++) {
        if (pool.teams[i].TEAM.toLowerCase() === lower) {
          return { pool: pool.poolName, division: division.division, position: i + 1 };
        }
      }
    }
  }
  return null;
}

// Find where a team would go in the upper pool based on pool finish
function findUpperPoolPath(teamName: string, pools: PoolStandings[]): string[] {
  const lower = teamName.toLowerCase();
  const info: string[] = [];

  for (const div of pools) {
    for (const pool of div.pools) {
      const idx = pool.teams.findIndex(t => t.TEAM.toLowerCase() === lower);
      if (idx < 0) continue;

      const poolKey = pool.poolName.replace('POOL ', '');
      const pos = idx + 1;
      const ref = `${pos}${poolKey}`;

      // Find which upper pool this ref appears in
      for (const pool2 of div.pools) {
        const upperIdx = pool2.teams.findIndex(t => t.TEAM === ref);
        if (upperIdx >= 0) {
          const opponents = pool2.teams.filter(t => t.TEAM !== ref).map(t => t.TEAM);
          info.push(`#${pos} in ${pool.poolName} → Upper ${pool2.poolName} vs ${opponents.join(', ')}`);
        }
      }
      return info;
    }
  }
  return info;
}

export default function BracketPage() {
  const { myTeam } = useMyTeam();
  const [params] = useSearchParams();
  const teamParam = params.get('team');
  const [matches, setMatches] = useState<Match[]>([]);
  const [pools, setPools] = useState<PoolStandings[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>(teamParam || myTeam || '');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const update = (data: Match[]) => { setMatches(data); setTeams(getUniqueTeams(data)); };
    fetchSchedule().then(update).catch(() => {});
    const unsub = onScheduleUpdate(update);
    fetchPools().then(setPools).catch(() => {});
    return unsub;
  }, []);

  const resMap = useMemo(() => buildResolutionMap(pools, matches), [pools, matches]);

  const teamDivision = useMemo(() => {
    if (!selectedTeam) return null;
    const lower = selectedTeam.toLowerCase();
    const m = matches.find(m => m.team1.toLowerCase() === lower || m.team2.toLowerCase() === lower);
    return m?.division || null;
  }, [matches, selectedTeam]);

  const teamPool = useMemo(() => {
    if (!selectedTeam) return null;
    return findTeamPool(selectedTeam, pools);
  }, [selectedTeam, pools]);

  const upperPoolInfo = useMemo(() => {
    if (!selectedTeam) return [];
    return findUpperPoolPath(selectedTeam, pools);
  }, [selectedTeam, pools]);

  const bracketPath = useMemo(() => {
    if (!selectedTeam || !teamDivision) return [];
    return tracePath(selectedTeam, teamDivision, matches, resMap);
  }, [selectedTeam, teamDivision, matches, resMap]);

  const filtered = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return teams.filter(t => t.toLowerCase().includes(q));
  }, [teams, search]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Bracket Path</h1>
      <p className={styles.subtitle}>See your journey through the tournament</p>

      {!selectedTeam ? (
        <div className={styles.picker}>
          <input
            type="text"
            placeholder="Search your team..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.search}
            autoFocus
          />
          <div className={styles.teamList}>
            {filtered.slice(0, 30).map(team => (
              <button
                key={team}
                className={styles.teamBtn}
                onClick={() => { setSelectedTeam(team); setSearch(''); }}
              >
                {getFlag(team)} {team}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className={styles.teamHeader}>
            <span className={styles.teamName}>{getFlag(selectedTeam)} {selectedTeam}</span>
            <button className={styles.changeBtn} onClick={() => setSelectedTeam('')}>Change</button>
          </div>

          {teamPool && (
            <div className={styles.poolInfo}>
              <span className={styles.poolBadge}>{teamDivision}</span>
              <span>{teamPool.pool}</span>
              <span className={styles.poolPos}>#{teamPool.position}</span>
            </div>
          )}

          {/* Upper pool projection */}
          {upperPoolInfo.length > 0 && (
            <div className={styles.projection}>
              {upperPoolInfo.map((info, i) => (
                <p key={i} className={styles.projectionLine}>{info}</p>
              ))}
            </div>
          )}

          {bracketPath.length > 0 ? (
            <div className={styles.path}>
              {bracketPath.map((step, i) => (
                <div key={i} className={styles.step}>
                  <div className={styles.stepLine}>
                    <div className={`${styles.stepDot} ${step.outcome !== 'unknown' ? styles[step.outcome] : ''}`} />
                    {i < bracketPath.length - 1 && <div className={styles.stepConnector} />}
                  </div>
                  <div className={styles.stepContent}>
                    <div className={styles.stepHeader}>
                      <span className={styles.roundLabel}>{step.roundLabel}</span>
                      {step.placement && <span className={styles.placement}>for {step.placement}</span>}
                    </div>
                    <div className={styles.opponent}>
                      vs {isPlaceholder(step.opponent) && step.opponentResolved !== step.opponent ? (
                        <><span className={styles.resolved}>{getFlag(step.opponentResolved)} {step.opponentResolved}</span> <span className={styles.ref}>({step.opponent})</span></>
                      ) : isPlaceholder(step.opponent) ? (
                        <span className={styles.placeholder}>{step.opponent}</span>
                      ) : (
                        <span>{getFlag(step.opponent)} {step.opponent}</span>
                      )}
                    </div>
                    {step.outcome !== 'unknown' && (
                      <span className={`${styles.outcomeTag} ${styles[step.outcome]}`}>
                        {step.outcome === 'win' ? 'Won' : 'Lost'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : teamDivision ? (
            <p className={styles.empty}>Bracket path will appear once knockout matches begin.</p>
          ) : (
            <p className={styles.empty}>Could not determine division for this team.</p>
          )}
        </>
      )}
    </div>
  );
}
