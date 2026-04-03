import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchSchedule, getFlag, onScheduleUpdate } from '../services/scheduleService';
import { fetchPools } from '../services/poolsService';
import { getMatchStatus, getDayLabel, formatTime, getTeamMatches } from '../utils/time';
import { useMyTeam } from '../hooks/useMyTeam';
import type { Match } from '../types/match';
import type { PoolStandings, PoolRow } from '../types/pool';
import DivisionBadge from '../components/common/DivisionBadge';
import styles from './TeamPage.module.css';

function findTeamPool(name: string, pools: PoolStandings[]): { division: string; poolName: string; row: PoolRow; position: number } | null {
  const lower = name.toLowerCase();
  for (const div of pools) {
    for (const pool of div.pools) {
      for (let i = 0; i < pool.teams.length; i++) {
        if (pool.teams[i].TEAM.toLowerCase() === lower) {
          return { division: div.division, poolName: pool.poolName, row: pool.teams[i], position: i + 1 };
        }
      }
    }
  }
  return null;
}

export default function TeamPage() {
  const { teamName } = useParams<{ teamName: string }>();
  const decoded = decodeURIComponent(teamName || '');
  const { isFollowed, toggleFollow, myTeam, setMyTeam } = useMyTeam();
  const [matches, setMatches] = useState<Match[]>([]);
  const [pools, setPools] = useState<PoolStandings[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule().then(setMatches).catch(() => {}).finally(() => setLoading(false));
    fetchPools().then(setPools).catch(() => {});
    return onScheduleUpdate(setMatches);
  }, []);

  const flag = getFlag(decoded);
  const followed = isFollowed(decoded);

  const teamMatches = useMemo(() => getTeamMatches(matches, decoded), [matches, decoded]);

  const division = useMemo(() => {
    const m = teamMatches[0];
    return m?.division || null;
  }, [teamMatches]);

  const poolInfo = useMemo(() => findTeamPool(decoded, pools), [decoded, pools]);

  const record = useMemo(() => {
    let w = 0, l = 0, gf = 0, ga = 0;
    for (const m of teamMatches) {
      if (!m.hasScore) continue;
      const isT1 = m.team1.toLowerCase() === decoded.toLowerCase();
      const my = isT1 ? m.score1 : m.score2;
      const opp = isT1 ? m.score2 : m.score1;
      gf += my;
      ga += opp;
      if (my > opp) w++;
      else if (opp > my) l++;
    }
    return { w, l, gf, ga, gd: gf - ga };
  }, [teamMatches, decoded]);

  const grouped = useMemo(() => {
    const days: Record<string, Match[]> = {};
    for (const m of teamMatches) {
      if (!days[m.day]) days[m.day] = [];
      days[m.day].push(m);
    }
    return days;
  }, [teamMatches]);

  if (loading) {
    return <div className={styles.page}><div className="skeleton" style={{ height: 200 }} /></div>;
  }

  if (!decoded || teamMatches.length === 0) {
    return (
      <div className={styles.page}>
        <p className={styles.notFound}>Team not found</p>
        <Link to="/" className={styles.backLink}>Back to schedule</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.back}>← Schedule</Link>

      {/* Team header */}
      <div className={styles.header}>
        <div className={styles.nameRow}>
          {flag && <span className={styles.flag}>{flag}</span>}
          <h1 className={styles.name}>{decoded}</h1>
        </div>
        <div className={styles.meta}>
          {division && <DivisionBadge division={division} />}
          {poolInfo && <span className={styles.pool}>{poolInfo.poolName}</span>}
        </div>
        <button
          className={`${styles.followBtn} ${followed ? styles.following : ''}`}
          onClick={() => !myTeam ? setMyTeam(decoded) : toggleFollow(decoded)}
        >
          {followed ? '★ Following' : '☆ Follow'}
        </button>
      </div>

      {/* Record stats */}
      {record.w + record.l > 0 && (
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{record.w}</span>
            <span className={styles.statLabel}>W</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNum}>{record.l}</span>
            <span className={styles.statLabel}>L</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNum}>{record.gf}</span>
            <span className={styles.statLabel}>GF</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNum}>{record.ga}</span>
            <span className={styles.statLabel}>GA</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={`${styles.statNum} ${record.gd > 0 ? styles.positive : record.gd < 0 ? styles.negative : ''}`}>
              {record.gd > 0 ? '+' : ''}{record.gd}
            </span>
            <span className={styles.statLabel}>GD</span>
          </div>
        </div>
      )}

      {/* Pool position */}
      {poolInfo && (
        <div className={styles.poolCard}>
          <span className={styles.poolTitle}>{poolInfo.poolName}</span>
          <span className={styles.poolPos}>#{poolInfo.position}</span>
          <span className={styles.poolRecord}>
            {poolInfo.row.W}W {poolInfo.row.L}L · {poolInfo.row.PT}pts
          </span>
        </div>
      )}

      {/* Matches by day */}
      {['saturday', 'sunday', 'monday'].map(day => {
        const dayMatches = grouped[day];
        if (!dayMatches?.length) return null;
        return (
          <div key={day} className={styles.section}>
            <h2 className={styles.sectionTitle}>{getDayLabel(day)}</h2>
            <div className={styles.matchList}>
              {dayMatches.map(m => {
                const isT1 = m.team1.toLowerCase() === decoded.toLowerCase();
                const opp = isT1 ? m.team2 : m.team1;
                const myScore = isT1 ? m.score1 : m.score2;
                const oppScore = isT1 ? m.score2 : m.score1;
                const status = getMatchStatus(m);
                const won = m.hasScore && myScore > oppScore;
                const lost = m.hasScore && oppScore > myScore;

                return (
                  <Link key={m.id} to={`/match/${m.id}`} className={`${styles.matchRow} ${won ? styles.won : ''} ${lost ? styles.lost : ''}`}>
                    <span className={styles.matchTime}>{formatTime(m.time)}</span>
                    <div className={styles.matchInfo}>
                      <span className={styles.matchOpp}>
                        vs <Link to={`/team/${encodeURIComponent(opp)}`} className={styles.oppLink} onClick={e => e.stopPropagation()}>
                          {getFlag(opp)} {opp}
                        </Link>
                      </span>
                      <span className={styles.matchMeta}>{m.matchType}</span>
                    </div>
                    <div className={styles.matchResult}>
                      {m.hasScore ? (
                        <span className={`${styles.score} ${won ? styles.scoreWin : lost ? styles.scoreLose : ''}`}>
                          {myScore}-{oppScore}
                        </span>
                      ) : status === 'live' ? (
                        <span className={styles.live}>LIVE</span>
                      ) : (
                        <span className={styles.upcoming}>{m.field}</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Bracket path link */}
      <Link to={`/bracket?team=${encodeURIComponent(decoded)}`} className={styles.bracketLink}>
        View bracket path →
      </Link>
    </div>
  );
}
