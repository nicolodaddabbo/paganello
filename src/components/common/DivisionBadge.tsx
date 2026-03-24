import { DIVISION_COLORS } from '../../utils/match';
import styles from './DivisionBadge.module.css';

const DIVISION_LABELS: Record<string, string> = {
  RM: 'Real Mixed',
  LM: 'Loose Mixed',
  O: 'Open',
  W: 'Women',
  U20: 'U20',
  U15: 'U15',
};

export default function DivisionBadge({ division, compact }: { division: string; compact?: boolean }) {
  const color = DIVISION_COLORS[division] || 'var(--text-muted)';
  const label = compact ? division : (DIVISION_LABELS[division] || division);

  return (
    <span
      className={styles.badge}
      style={{ '--badge-color': color } as React.CSSProperties}
    >
      {label}
    </span>
  );
}
