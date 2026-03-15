import { memo } from 'react';
import type { Match } from '../../types/match';
import styles from '../../styles/Schedule.module.css';

interface MatchCardProps {
  match: Match;
  isFavorite: (team: string) => boolean;
  toggleFavorite: (team: string) => void;
}

function MatchCard({ match, isFavorite, toggleFavorite }: MatchCardProps) {
  const team1IsFavorite = isFavorite(match.team1);
  const team2IsFavorite = isFavorite(match.team2);

  return (
    <div className={styles.matchCard}>
      <div className={styles.matchMeta}>
        <div className={styles.matchHeader}>
          <span className={styles.day}>{match.day}</span>
          <span className={styles.time}>{match.time}</span>
        </div>
        <div className={styles.matchInfo}>
          <span className={styles.field}>{match.field}</span>
          <span className={styles.divisionBadge}>{match.division}</span>
        </div>
      </div>

      <div className={styles.matchup}>
        <div className={styles.teamSection}>
          <button
            className={`${styles.favoriteBtn} ${team1IsFavorite ? styles.active : ''}`}
            onClick={() => toggleFavorite(match.team1)}
            aria-label={team1IsFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            ★
          </button>
          <span className={styles.teamName}>{match.team1}</span>
          {match.hasScore && <span className={styles.teamScore}>{match.score1}</span>}
        </div>

        <div className={styles.vs}>vs</div>

        <div className={styles.teamSection}>
          <button
            className={`${styles.favoriteBtn} ${team2IsFavorite ? styles.active : ''}`}
            onClick={() => toggleFavorite(match.team2)}
            aria-label={team2IsFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            ★
          </button>
          <span className={styles.teamName}>{match.team2}</span>
          {match.hasScore && <span className={styles.teamScore}>{match.score2}</span>}
        </div>
      </div>
    </div>
  );
}

export default memo(MatchCard);
