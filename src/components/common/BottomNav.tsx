import { NavLink } from 'react-router-dom';
import styles from './BottomNav.module.css';

const ScheduleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="2" y="3" width="16" height="14" rx="2" />
    <line x1="2" y1="7.5" x2="18" y2="7.5" />
    <line x1="7" y1="3" x2="7" y2="17" />
  </svg>
);

const StandingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="10" width="4" height="7" rx="1" />
    <rect x="8" y="4" width="4" height="13" rx="1" />
    <rect x="13" y="7" width="4" height="10" rx="1" />
  </svg>
);

const LiveIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <circle cx="10" cy="10" r="4" />
    <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
  </svg>
);

const SpiritIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 1.5l2.1 6.5H19l-5.5 4 2.1 6.5L10 14.5 4.4 18.5l2.1-6.5L1 8h6.9z" />
  </svg>
);

const MoreIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <circle cx="4" cy="10" r="2" />
    <circle cx="10" cy="10" r="2" />
    <circle cx="16" cy="10" r="2" />
  </svg>
);

const tabs = [
  { to: '/', label: 'Schedule', Icon: ScheduleIcon },
  { to: '/pools', label: 'Standings', Icon: StandingsIcon },
  { to: '/live', label: 'Live', Icon: LiveIcon },
  { to: '/sotg', label: 'Spirit', Icon: SpiritIcon },
  { to: '/more', label: 'More', Icon: MoreIcon },
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
          <span className={styles.icon}><tab.Icon /></span>
          <span className={styles.label}>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
