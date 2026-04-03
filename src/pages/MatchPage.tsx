import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Match } from '../types/match';
import { fetchSchedule, getFlag } from '../services/scheduleService';
import { getMatchStatus, getDayLabel, formatTime } from '../utils/time';
import { useMyTeam } from '../hooks/useMyTeam';
import DivisionBadge from '../components/common/DivisionBadge';
import styles from './MatchPage.module.css';

const CONFETTI = ['🎉', '🏆', '✨', '⭐', '🥏', '🎊'];

function spawnConfetti() {
  const container = document.createElement('div');
  Object.assign(container.style, {
    position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '9999', overflow: 'hidden',
  });
  document.body.appendChild(container);

  for (let i = 0; i < 40; i++) {
    const el = document.createElement('div');
    el.textContent = CONFETTI[Math.floor(Math.random() * CONFETTI.length)];
    Object.assign(el.style, {
      position: 'absolute',
      left: `${Math.random() * 100}vw`,
      top: '-40px',
      fontSize: `${1.2 + Math.random() * 1.5}rem`,
      animation: `confetti-fall ${1.5 + Math.random() * 2}s ${Math.random() * 0.8}s ease-out forwards`,
    });
    container.appendChild(el);
  }

  setTimeout(() => container.remove(), 4500);
}

export default function MatchPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { myTeam, isFollowed, toggleFollow, setMyTeam } = useMyTeam();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const confettiFired = useRef(false);

  useEffect(() => {
    fetchSchedule().then(setMatches).catch(() => { }).finally(() => setLoading(false));
  }, []);

  const match = useMemo(() => matches.find(m => m.id === matchId), [matches, matchId]);

  const t1Wins = match ? match.hasScore && match.score1 > match.score2 : false;
  const t2Wins = match ? match.hasScore && match.score2 > match.score1 : false;
  const myTeamWon = match ? match.hasScore && (
    (t1Wins && isFollowed(match.team1)) ||
    (t2Wins && isFollowed(match.team2))
  ) : false;

  useEffect(() => {
    if (myTeamWon && !confettiFired.current) {
      confettiFired.current = true;
      spawnConfetti();
    }
  }, [myTeamWon]);

  // Other matches in the same pool/bracket group
  const poolMatches = useMemo(() => {
    if (!match) return [];
    // Extract pool identifier (e.g., "RM POOL A" from "RM POOL A (1-48)")
    const poolMatch = match.matchType.match(/^(\w+\s+POOL\s+\w+)/);
    if (!poolMatch) return [];
    const poolPrefix = poolMatch[1];
    return matches
      .filter(m => m.id !== match.id && m.matchType.startsWith(poolPrefix))
      .slice(0, 10);
  }, [matches, match]);

  // Each team's other games today
  const team1Games = useMemo(() => {
    if (!match) return [];
    return matches.filter(m =>
      m.id !== match.id &&
      m.day === match.day &&
      (m.team1 === match.team1 || m.team2 === match.team1)
    );
  }, [matches, match]);

  const team2Games = useMemo(() => {
    if (!match) return [];
    return matches.filter(m =>
      m.id !== match.id &&
      m.day === match.day &&
      (m.team1 === match.team2 || m.team2 === match.team2)
    );
  }, [matches, match]);

  if (loading) {
    return <div className={styles.page}><div className="skeleton" style={{ height: 200 }} /></div>;
  }

  if (!match) {
    return (
      <div className={styles.page}>
        <p className={styles.notFound}>Match not found</p>
        <Link to="/" className={styles.backLink}>Back to schedule</Link>
      </div>
    );
  }

  const status = getMatchStatus(match);

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.back}>← Schedule</Link>

      <div className={styles.card}>
        <div className={styles.meta}>
          <DivisionBadge division={match.division} />
          <span className={styles.matchType}>{match.matchType}</span>
        </div>

        {/* Score / VS */}
        <div className={styles.matchup}>
          <div className={styles.teamCol}>
            <span className={`${styles.teamName} ${t1Wins ? styles.winner : ''} ${isFollowed(match.team1) ? styles.myTeam : ''}`}>
              {getFlag(match.team1) && <span className={styles.flag}>{getFlag(match.team1)}</span>}
              {match.team1}
            </span>
            <button
              className={`${styles.followBtn} ${isFollowed(match.team1) ? styles.following : ''}`}
              onClick={() => !myTeam ? setMyTeam(match.team1) : toggleFollow(match.team1)}
            >
              {isFollowed(match.team1) ? '★ Following' : '☆ Follow'}
            </button>
          </div>

          <div className={styles.center}>
            {match.hasScore ? (
              <div className={styles.scores}>
                <span className={t1Wins ? styles.bigScore : styles.dimScore}>{match.score1}</span>
                <span className={styles.scoreDash}>-</span>
                <span className={t2Wins ? styles.bigScore : styles.dimScore}>{match.score2}</span>
              </div>
            ) : (
              <span className={styles.vsLabel}>VS</span>
            )}
            {status === 'live' && <div className={styles.liveBadge}><span className={styles.liveDot} />LIVE</div>}
            {status === 'completed' && <div className={styles.finalBadge}>FINAL</div>}
          </div>

          <div className={styles.teamCol}>
            <span className={`${styles.teamName} ${t2Wins ? styles.winner : ''} ${isFollowed(match.team2) ? styles.myTeam : ''}`}>
              {getFlag(match.team2) && <span className={styles.flag}>{getFlag(match.team2)}</span>}
              {match.team2}
            </span>
            <button
              className={`${styles.followBtn} ${isFollowed(match.team2) ? styles.following : ''}`}
              onClick={() => !myTeam ? setMyTeam(match.team2) : toggleFollow(match.team2)}
            >
              {isFollowed(match.team2) ? '★ Following' : '☆ Follow'}
            </button>
          </div>
        </div>

        {/* Details */}
        <div className={styles.details}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>When</span>
            <span className={styles.detailValue}>{getDayLabel(match.day)}, {formatTime(match.time)}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Where</span>
            <Link to={`/map?field=${encodeURIComponent(match.field)}&time=${encodeURIComponent(match.time)}`} className={styles.fieldLink}>{match.field} →</Link>
          </div>
        </div>
      </div>

      {/* Pool context */}
      {poolMatches.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Other pool games</h3>
          <div className={styles.miniList}>
            {poolMatches.map(m => (
              <Link key={m.id} to={`/match/${m.id}`} className={styles.miniRow}>
                <span className={styles.miniTime}>{formatTime(m.time)}</span>
                <span className={styles.miniTeams}>
                  <span className={m.hasScore && m.score1 > m.score2 ? styles.miniBold : ''}>{m.team1}</span>
                  {m.hasScore ? (
                    <span className={styles.miniScore}>{m.score1}-{m.score2}</span>
                  ) : (
                    <span className={styles.miniVs}>vs</span>
                  )}
                  <span className={m.hasScore && m.score2 > m.score1 ? styles.miniBold : ''}>{m.team2}</span>
                </span>
                <span className={styles.miniField}>{m.field}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Team schedules today */}
      {[
        { team: match.team1, games: team1Games },
        { team: match.team2, games: team2Games },
      ].map(({ team, games }) => games.length > 0 && (
        <div key={team} className={styles.section}>
          <h3 className={styles.sectionTitle}>{team}'s other games ({getDayLabel(match.day)})</h3>
          <div className={styles.miniList}>
            {games.map(m => {
              const opp = m.team1 === team ? m.team2 : m.team1;
              const myScore = m.team1 === team ? m.score1 : m.score2;
              const oppScore = m.team1 === team ? m.score2 : m.score1;
              return (
                <Link key={m.id} to={`/match/${m.id}`} className={styles.miniRow}>
                  <span className={styles.miniTime}>{formatTime(m.time)}</span>
                  <span className={styles.miniTeams}>
                    vs {opp}
                    {m.hasScore && <span className={styles.miniScore}>{myScore}-{oppScore}</span>}
                  </span>
                  <span className={styles.miniField}>{m.field}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
