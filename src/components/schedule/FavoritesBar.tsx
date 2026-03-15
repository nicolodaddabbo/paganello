import styles from '../../styles/Schedule.module.css';

interface FavoritesBarProps {
  favoriteTeams: string[];
  removeFavorite: (team: string) => void;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (show: boolean) => void;
}

export default function FavoritesBar({
  favoriteTeams,
  removeFavorite,
  showFavoritesOnly,
  setShowFavoritesOnly,
}: FavoritesBarProps) {
  if (favoriteTeams.length === 0) return null;

  return (
    <div className={styles.favoritesBar}>
      <div className={styles.favoritesHeader}>
        <h3>Favorite Teams</h3>
        <label className={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={showFavoritesOnly}
            onChange={(e) => setShowFavoritesOnly(e.target.checked)}
          />
          Show only favorites
        </label>
      </div>

      <div className={styles.favoriteTags}>
        {favoriteTeams.map(team => (
          <div key={team} className={styles.favoriteTag}>
            <span>{team}</span>
            <button
              onClick={() => removeFavorite(team)}
              aria-label={`Remove ${team} from favorites`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
