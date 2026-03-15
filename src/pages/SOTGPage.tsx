import DivisionCard from '../components/sotg/DivisionCard';
import styles from '../styles/SOTG.module.css';

const divisions = [
  { name: 'Real Mixed', formUrl: '#' },
  { name: 'Loose Mixed', formUrl: '#' },
  { name: 'Open', formUrl: '#' },
  { name: 'Women', formUrl: '#' },
  { name: 'U20', formUrl: '#' },
  { name: 'U15', formUrl: '#' },
];

export default function SOTGPage() {
  return (
    <div className={styles.sotgPage}>
      <div className={styles.header}>
        <h1>Spirit of the Game</h1>
        <p>Submit your SOTG scores for each division</p>
      </div>

      <div className={styles.divisionGrid}>
        {divisions.map(division => (
          <DivisionCard
            key={division.name}
            division={division.name}
            formUrl={division.formUrl}
          />
        ))}
      </div>

      <div className={styles.info}>
        <h2>About Spirit of the Game</h2>
        <p>
          Spirit of the Game is a set of principles which places the responsibility for fair play
          on the player. Highly competitive play is encouraged, but never at the expense of mutual
          respect among competitors, adherence to the agreed upon rules, or the basic joy of play.
        </p>
      </div>
    </div>
  );
}
