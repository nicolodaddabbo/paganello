import { Link } from 'react-router-dom';
import paganelloLogo from '../../assets/Paganello_Logo_White.svg';
import styles from './TopBar.module.css';

export default function TopBar() {
  return (
    <header className={styles.topBar}>
      <Link to="/" className={styles.logo}>
        <img src={paganelloLogo} alt="Paganello" className={styles.logoImg} />
        <span className={styles.title}>Paganello 2026</span>
      </Link>
    </header>
  );
}
