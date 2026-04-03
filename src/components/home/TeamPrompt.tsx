import { useState, useMemo } from 'react';
import styles from './TeamPrompt.module.css';

interface Props {
  teams: string[];
  onSelectTeam: (team: string) => void;
  onDismiss: () => void;
  expanded: boolean;
  onExpand: () => void;
}

export default function TeamPrompt({ teams, onSelectTeam, onDismiss, expanded, onExpand }: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return teams.filter(t => t.toLowerCase().includes(q));
  }, [teams, search]);

  if (!expanded) {
    return (
      <div className={styles.banner}>
        <p className={styles.question}>Are you playing at Paganello?</p>
        <button className={styles.playerBtn} onClick={onExpand}>Find my team</button>
        <button className={styles.spectatorBtn} onClick={onDismiss}>Just watching</button>
      </div>
    );
  }

  return (
    <div className={styles.picker}>
      <div className={styles.pickerHeader}>
        <span className={styles.pickerTitle}>Pick your team</span>
        <button className={styles.dismissBtn} onClick={onDismiss}>&times;</button>
      </div>
      <input
        type="text"
        placeholder="Search teams..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className={styles.search}
        autoFocus
      />
      <div className={styles.list}>
        {filtered.slice(0, 50).map(team => (
          <button key={team} className={styles.teamBtn} onClick={() => onSelectTeam(team)}>
            {team}
          </button>
        ))}
        {filtered.length === 0 && <p className={styles.empty}>No teams found</p>}
      </div>
    </div>
  );
}
