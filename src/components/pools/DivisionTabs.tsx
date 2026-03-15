import styles from '../../styles/Pools.module.css';

interface DivisionTabsProps {
  divisions: string[];
  selectedDivision: string;
  onSelectDivision: (division: string) => void;
}

export default function DivisionTabs({
  divisions,
  selectedDivision,
  onSelectDivision,
}: DivisionTabsProps) {
  return (
    <div className={styles.divisionTabs}>
      {divisions.map(division => (
        <button
          key={division}
          className={`${styles.tab} ${selectedDivision === division ? styles.active : ''}`}
          onClick={() => onSelectDivision(division)}
        >
          {division}
        </button>
      ))}
    </div>
  );
}
