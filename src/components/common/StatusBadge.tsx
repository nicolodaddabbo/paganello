import type { MatchStatus } from '../../utils/time';
import styles from './StatusBadge.module.css';

export default function StatusBadge({ status }: { status: MatchStatus }) {
  if (status === 'live') {
    return <span className={`${styles.badge} ${styles.live}`}><span className={styles.dot} /> LIVE</span>;
  }
  if (status === 'completed') {
    return <span className={`${styles.badge} ${styles.completed}`}>FINAL</span>;
  }
  return null;
}
