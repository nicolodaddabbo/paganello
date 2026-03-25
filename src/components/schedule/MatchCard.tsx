import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { Match } from '../../types/match';
import { getMatchStatus, formatTime } from '../../utils/time';
import { DIVISION_COLORS, isPlaceholder, isKnockout } from '../../utils/match';
import { getFlag } from '../../services/scheduleService';
import styles from './MatchCard.module.css';

interface Props {
  match: Match;
  isFollowed?: (team: string) => boolean;
  showTime?: boolean;
}

function MatchCard({ match, isFollowed, showTime = false }: Props) {
  const status = getMatchStatus(match);
  const t1Followed = isFollowed?.(match.team1) ?? false;
  const t2Followed = isFollowed?.(match.team2) ?? false;
  const isMyGame = t1Followed || t2Followed;
  const knockout = isKnockout(match.matchType);
  const divColor = DIVISION_COLORS[match.division] || 'var(--border)';

  const t1Wins = match.hasScore && match.score1 > match.score2;
  const t2Wins = match.hasScore && match.score2 > match.score1;
  const t1Placeholder = isPlaceholder(match.team1);
  const t2Placeholder = isPlaceholder(match.team2);

  return (
    <Link
      to={`/match/${match.id}`}
      className={`${styles.row} ${status === 'live' ? styles.live : ''} ${isMyGame ? styles.mine : ''}`}
      style={{ '--div-color': divColor } as React.CSSProperties}
    >
      <div className={styles.divStripe} />

      {showTime && <div className={styles.timeCol}>{formatTime(match.time)}</div>}

      {status === 'live' && <div className={styles.liveTag}>LIVE</div>}

      <div className={styles.team1}>
        <span className={`${styles.name} ${t1Wins ? styles.winner : ''} ${t1Followed ? styles.myName : ''} ${t1Placeholder ? styles.placeholder : ''}`}>
          {getFlag(match.team1) && <span className={styles.flag}>{getFlag(match.team1)}</span>}
          {match.team1}
        </span>
      </div>

      <div className={styles.scoreCol}>
        {match.hasScore ? (
          <>
            {t1Wins && <span className={styles.arrow}>◄</span>}
            <span className={t1Wins ? styles.winScore : styles.loseScore}>{match.score1}</span>
            <span className={styles.dash}>-</span>
            <span className={t2Wins ? styles.winScore : styles.loseScore}>{match.score2}</span>
            {t2Wins && <span className={styles.arrow}>►</span>}
          </>
        ) : (
          <span className={styles.vs}>vs</span>
        )}
      </div>

      <div className={styles.team2}>
        <span className={`${styles.name} ${t2Wins ? styles.winner : ''} ${t2Followed ? styles.myName : ''} ${t2Placeholder ? styles.placeholder : ''}`}>
          {getFlag(match.team2) && <span className={styles.flag}>{getFlag(match.team2)}</span>}
          {match.team2}
        </span>
      </div>

      <div className={styles.infoCol}>
        <span className={`${styles.matchType} ${knockout ? styles.knockout : ''}`}>{match.matchType}</span>
        <span className={styles.field}>{match.field}</span>
      </div>
    </Link>
  );
}

export default memo(MatchCard);
