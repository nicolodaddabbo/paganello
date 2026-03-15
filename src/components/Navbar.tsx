import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import styles from '../styles/Navbar.module.css';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <a
          href="https://paganello.com"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.logo}
        >
          Paganello 2026
        </a>

        <button
          className={styles.hamburger}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`${styles.navLinks} ${isMenuOpen ? styles.open : ''}`}>
          <NavLink
            to="/"
            className={({ isActive }) => isActive ? styles.active : ''}
            onClick={closeMenu}
          >
            Schedule
          </NavLink>
          <NavLink
            to="/pools"
            className={({ isActive }) => isActive ? styles.active : ''}
            onClick={closeMenu}
          >
            Pools
          </NavLink>
          <NavLink
            to="/sotg"
            className={({ isActive }) => isActive ? styles.active : ''}
            onClick={closeMenu}
          >
            SOTG
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
