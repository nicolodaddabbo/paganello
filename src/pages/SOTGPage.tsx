import styles from './SOTGPage.module.css';

const DIVISIONS = [
  { name: 'Real Mixed', url: 'https://forms.gle/FCk8CNq8xWfURdzSA' },
  { name: 'Loose Mixed', url: 'https://forms.gle/KGC7vKLeyLkQJbN48' },
  { name: 'Open', url: 'https://forms.gle/48XVpNJrUYCBnnts5' },
  { name: 'Women', url: 'https://forms.gle/Yo6A6mtF6JfwNEw47' },
  { name: 'U20', url: 'https://forms.gle/YAwztNRizrArdQTz6' },
  { name: 'U15', url: 'https://forms.gle/SrFQJW8ukXCVHGiL6' },
];

export default function SOTGPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Spirit of the Game</h1>
      <p className={styles.subtitle}>Rate your opponent after each game. Select your division to open the form.</p>

      <div className={styles.divisions}>
        {DIVISIONS.map(div => (
          <a
            key={div.name}
            href={div.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.divLink}
          >
            <span className={styles.divName}>{div.name}</span>
            <span className={styles.arrow}>↗</span>
          </a>
        ))}
      </div>
    </div>
  );
}
