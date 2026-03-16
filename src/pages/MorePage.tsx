import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMyTeam } from '../hooks/useMyTeam';
import { fetchSchedule, getUniqueTeams } from '../services/scheduleService';
import styles from './MorePage.module.css';

export default function MorePage() {
  const { myTeam, clearMyTeam, toggleFollow, allFollowed } = useMyTeam();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<string[]>([]);
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSchedule().then(data => setTeams(getUniqueTeams(data))).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!search) return teams;
    const q = search.toLowerCase();
    return teams.filter(t => t.toLowerCase().includes(q));
  }, [teams, search]);

  const handleChangeTeam = () => {
    clearMyTeam();
    navigate('/');
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>More</h1>

      <div className={styles.section}>
        <Link to="/sotg" className={styles.link}>
          <span>Spirit of the Game</span>
          <span className={styles.arrow}>→</span>
        </Link>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Settings</h2>
        <div className={styles.setting}>
          <div>
            <div className={styles.settingLabel}>My Team</div>
            <div className={styles.settingValue}>{myTeam || 'None'}</div>
          </div>
          <button className={styles.settingBtn} onClick={handleChangeTeam}>Change</button>
        </div>
      </div>

      {/* Followed teams */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Followed Teams</h2>
        <p className={styles.sectionDesc}>Follow other teams to highlight their games in the schedule</p>

        {allFollowed.length > 0 && (
          <div className={styles.followedList}>
            {allFollowed.map(team => (
              <div key={team} className={styles.followedItem}>
                <span className={styles.followedName}>
                  {team}
                  {myTeam && team.toLowerCase() === myTeam.toLowerCase() && (
                    <span className={styles.primaryBadge}>You</span>
                  )}
                </span>
                {!(myTeam && team.toLowerCase() === myTeam.toLowerCase()) && (
                  <button className={styles.removeBtn} onClick={() => toggleFollow(team)}>×</button>
                )}
              </div>
            ))}
          </div>
        )}

        <button className={styles.addBtn} onClick={() => setShowTeamPicker(!showTeamPicker)}>
          {showTeamPicker ? 'Done' : '+ Follow a team'}
        </button>

        {showTeamPicker && (
          <div className={styles.picker}>
            <input
              type="text"
              placeholder="Search teams..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.pickerSearch}
              autoFocus
            />
            <div className={styles.pickerList}>
              {filtered.slice(0, 40).map(team => {
                const followed = allFollowed.some(f => f.toLowerCase() === team.toLowerCase());
                return (
                  <button
                    key={team}
                    className={`${styles.pickerItem} ${followed ? styles.pickerItemActive : ''}`}
                    onClick={() => toggleFollow(team)}
                  >
                    <span>{team}</span>
                    <span className={styles.checkmark}>{followed ? '✓' : '+'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>About</h2>
        <p className={styles.about}>
          Paganello 2026 — XXXIV Edition<br />
          April 4–6, Rimini Beach, Italy
        </p>
        <a href="https://paganello.com" target="_blank" rel="noopener noreferrer" className={styles.link}>
          <span>paganello.com</span>
          <span className={styles.arrow}>↗</span>
        </a>
      </div>
    </div>
  );
}
