import styles from '../../styles/SOTG.module.css';

interface DivisionCardProps {
  division: string;
  formUrl: string;
}

export default function DivisionCard({ division, formUrl }: DivisionCardProps) {
  return (
    <div className={styles.divisionCard}>
      <h2>{division}</h2>
      <p>Submit your Spirit of the Game scores for {division} division</p>
      <a
        href={formUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.formLink}
      >
        Open SOTG Form →
      </a>
    </div>
  );
}
