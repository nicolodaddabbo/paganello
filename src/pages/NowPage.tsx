import { useState, useEffect, useMemo } from 'react';
import type { Match } from '../types/match';
import { fetchSchedule } from '../services/scheduleService';
import { getMatchStatus, getMatchDate, getRelativeTime, getDayLabel, formatTime } from '../utils/time';
import DivisionBadge from '../components/common/DivisionBadge';
import styles from './NowPage.module.css';

export default function NowPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      fetchSchedule().then(setMatches).catch(() => { }).finally(() => setLoading(false));
    };
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  const liveMatches = useMemo(
    () => matches.filter(m => getMatchStatus(m) === 'live'),
    [matches]
  );

  const nextUpcoming = useMemo(() => {
    const upcoming = matches
      .filter(m => getMatchStatus(m) === 'upcoming')
      .sort((a, b) => getMatchDate(a).getTime() - getMatchDate(b).getTime());
    return upcoming[0] || null;
  }, [matches]);

  if (loading) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Live Now</h1>
        <div className={`skeleton ${styles.cardSkeleton}`} />
        <div className={`skeleton ${styles.cardSkeleton}`} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Live Now</h1>

      {liveMatches.length === 0 ? (
        <div className={styles.noLive}>
          <p className={styles.noLiveText}>No games in progress</p>
          {nextUpcoming && (
            <p className={styles.nextUp}>
              Next game: {getDayLabel(nextUpcoming.day)} at {formatTime(nextUpcoming.time)}
              {(() => { const rel = getRelativeTime(getMatchDate(nextUpcoming)); return rel ? ` (${rel})` : ''; })()}
            </p>
          )}
        </div>
      ) : (
        <>
          {nextUpcoming && (
            <p className={styles.nextBanner}>
              Next round {getRelativeTime(getMatchDate(nextUpcoming))}
            </p>
          )}
          <div className={styles.grid}>
            {liveMatches.map(match => (
              <div key={match.id} className={styles.liveCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.liveIndicator}>
                    <span className={styles.liveDot} />
                    LIVE
                  </div>
                  <DivisionBadge division={match.division} compact />
                </div>
                <div className={styles.matchup}>
                  <div className={styles.team}>
                    <span className={styles.teamName}>{match.team1}</span>
                    <span className={styles.score}>{match.score1}</span>
                  </div>
                  <div className={styles.team}>
                    <span className={styles.teamName}>{match.team2}</span>
                    <span className={styles.score}>{match.score2}</span>
                  </div>
                </div>
                <div className={styles.cardFooter}>
                  <span>{match.field}</span>
                  <span>{match.matchType}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
