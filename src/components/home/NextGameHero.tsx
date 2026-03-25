import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { Match } from '../../types/match';
import { getMatchDate, getMatchStatus, getRelativeTime, getDayLabel, formatTime, getMatchPerspective } from '../../utils/time';
import { getFlag } from '../../services/scheduleService';
import { useCountdown } from '../../hooks/useCountdown';
import DivisionBadge from '../common/DivisionBadge';
import styles from './NextGameHero.module.css';

/** Isolated countdown to avoid re-rendering the parent every second */
function CountdownDisplay({ date }: { date: Date }) {
  const countdown = useCountdown(date);
  const rel = getRelativeTime(date);
  return (
    <>
      <div className={styles.countdown}>{countdown.display}</div>
      {rel && <div className={styles.relTime}>{rel}</div>}
    </>
  );
}

interface Props {
  match: Match | null;
  myTeam: string;
}

function NextGameHero({ match, myTeam }: Props) {
  const status = match ? getMatchStatus(match) : 'upcoming';

  if (!match) {
    return (
      <div className={styles.hero}>
        <div className={styles.noGame}>
          <p className={styles.noGameText}>No more games scheduled</p>
          <p className={styles.teamLabel}>{myTeam}</p>
        </div>
      </div>
    );
  }

  const { opponent, myScore, oppScore } = getMatchPerspective(match, myTeam);
  const matchDate = getMatchDate(match);

  return (
    <Link to={`/match/${match.id}`} className={`${styles.hero} ${status === 'live' ? styles.live : ''}`}>
      <div className={styles.header}>
        <span className={styles.teamLabel}>{myTeam}</span>
        <DivisionBadge division={match.division} compact />
      </div>

      {status === 'live' ? (
        <>
          <div className={styles.statusLive}><span className={styles.liveDot} /> NOW PLAYING</div>
          <div className={styles.scores}>
            <span className={styles.score}>{myScore}</span>
            <span className={styles.scoreSep}>—</span>
            <span className={styles.score}>{oppScore}</span>
          </div>
        </>
      ) : status === 'completed' ? (
        <>
          <div className={styles.statusFinal}>FINAL</div>
          <div className={styles.scores}>
            <span className={styles.score}>{myScore}</span>
            <span className={styles.scoreSep}>—</span>
            <span className={styles.score}>{oppScore}</span>
          </div>
        </>
      ) : (
        <CountdownDisplay date={matchDate} />
      )}

      <div className={styles.opponent}>
        <span className={styles.vsLabel}>vs</span>
        <span className={styles.opponentName}>{getFlag(opponent)} {opponent}</span>
      </div>

      <div className={styles.meta}>
        <span>{getDayLabel(match.day)}</span>
        <span className={styles.dot}>·</span>
        <span>{formatTime(match.time)}</span>
        <span className={styles.dot}>·</span>
        <span>{match.field}</span>
      </div>
      <div className={styles.matchType}>{match.matchType}</div>
    </Link>
  );
}

export default memo(NextGameHero);
