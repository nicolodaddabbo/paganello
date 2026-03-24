import { useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import paganelloLogo from '../../assets/Paganello_Logo_White.svg';
import styles from './TopBar.module.css';

function spawnDiscs() {
  const count = 20;
  const container = document.createElement('div');
  container.className = styles.discRain;
  document.body.appendChild(container);

  for (let i = 0; i < count; i++) {
    const disc = document.createElement('div');
    disc.className = styles.disc;
    disc.textContent = '🥏';
    disc.style.left = `${Math.random() * 100}vw`;
    disc.style.animationDelay = `${Math.random() * 0.6}s`;
    disc.style.animationDuration = `${1.5 + Math.random() * 1.5}s`;
    container.appendChild(disc);
  }

  setTimeout(() => container.remove(), 3500);
}

export default function TopBar() {
  const tapsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleTap = useCallback(() => {
    tapsRef.current++;
    clearTimeout(timerRef.current);

    if (tapsRef.current >= 3) {
      tapsRef.current = 0;
      spawnDiscs();
      return;
    }

    timerRef.current = setTimeout(() => { tapsRef.current = 0; }, 800);
  }, []);

  return (
    <header className={styles.topBar} onClick={handleTap}>
      <Link to="/" className={styles.logo}>
        <img src={paganelloLogo} alt="Paganello" className={styles.logoImg} />
        <span className={styles.title}>Paganello 2026</span>
      </Link>
    </header>
  );
}
