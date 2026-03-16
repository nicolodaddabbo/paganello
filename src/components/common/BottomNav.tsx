import { NavLink } from 'react-router-dom';
import styles from './BottomNav.module.css';

const tabs = [
  { to: '/', label: 'Schedule', icon: '▤' },
  { to: '/pools', label: 'Standings', icon: '◉' },
  { to: '/live', label: 'Live', icon: '●' },
  { to: '/more', label: 'More', icon: '⋯' },
];

export default function BottomNav() {
  return (
    <nav className={styles.bottomNav}>
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}
        >
          <span className={styles.icon}>{tab.icon}</span>
          <span className={styles.label}>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
