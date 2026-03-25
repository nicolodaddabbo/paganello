import { Link } from 'react-router-dom';
import type { Match } from '../../types/match';
import { getMatchStatus, getRelativeTime, getMatchDate, getDayLabel, formatTime, getMatchPerspective, DAYS } from '../../utils/time';
import { getFlag } from '../../services/scheduleService';
import DivisionBadge from '../common/DivisionBadge';
import styles from './TeamDaySchedule.module.css';

interface Props {
  matches: Match[];
  myTeam: string;
  day: string;
  onDayChange: (day: string) => void;
}

export default function TeamDaySchedule({ matches, myTeam, day, onDayChange }: Props) {
  const dayMatches = matches.filter(m => m.day === day);

  return (
    <div className={styles.container}>
      <div className={styles.dayTabs}>
        {DAYS.map(d => (
          <button
            key={d}
            className={`${styles.dayTab} ${d === day ? styles.active : ''}`}
            onClick={() => onDayChange(d)}
          >
            {getDayLabel(d)}
          </button>
        ))}
      </div>

      {dayMatches.length === 0 ? (
        <p className={styles.empty}>No games on {getDayLabel(day)}</p>
      ) : (
        <div className={styles.timeline}>
          {dayMatches.map(match => {
            const status = getMatchStatus(match);
            const { opponent, myScore, oppScore } = getMatchPerspective(match, myTeam);
            const matchDate = getMatchDate(match);
            const rel = getRelativeTime(matchDate);

            return (
              <Link to={`/match/${match.id}`} key={match.id} className={`${styles.item} ${styles[status]}`}>
                <div className={styles.time}>
                  <span>{formatTime(match.time)}</span>
                  {status === 'upcoming' && rel && (
                    <span className={styles.rel}>{rel}</span>
                  )}
                </div>
                <div className={styles.content}>
                  <div className={styles.top}>
                    <span className={styles.opponent}>vs {getFlag(opponent)} {opponent}</span>
                    <DivisionBadge division={match.division} compact />
                  </div>
                  <div className={styles.bottom}>
                    <span className={styles.field}>{match.field}</span>
                    {status === 'completed' && (
                      <span className={styles.score}>{myScore}–{oppScore}</span>
                    )}
                    {status === 'live' && (
                      <span className={styles.liveLabel}>LIVE {myScore}–{oppScore}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
