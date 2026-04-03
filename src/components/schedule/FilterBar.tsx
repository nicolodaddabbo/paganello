import type { Filters, DivisionFilter, StatusFilter } from '../../types/match';
import { getActiveFilterCount } from '../../utils/filters';
import styles from './FilterBar.module.css';

interface Props {
  filters: Filters;
  updateFilter: (key: keyof Filters, value: string) => void;
  clearFilters: () => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  availableFields: string[];
  availableCountries: string[];
  myTeamsOnly?: boolean;
  setMyTeamsOnly?: (v: boolean) => void;
  hasFollowed?: boolean;
}

export default function FilterBar({
  filters, updateFilter, clearFilters,
  showFilters, setShowFilters,
  availableFields,
  availableCountries,
  myTeamsOnly = false,
  setMyTeamsOnly,
  hasFollowed = false,
}: Props) {
  const activeCount = getActiveFilterCount(filters) + (myTeamsOnly ? 1 : 0);

  return (
    <div className={styles.row}>
      <input
        type="text"
        placeholder="Search teams..."
        value={filters.search}
        onChange={e => updateFilter('search', e.target.value)}
        className={styles.search}
      />
      <div className={styles.filterWrapper}>
        <button className={styles.filterBtn} onClick={() => setShowFilters(!showFilters)}>
          Filters{activeCount > 0 && <span className={styles.badge}>{activeCount}</span>}
        </button>

        {showFilters && (
          <>
            <div className={styles.backdrop} onClick={() => setShowFilters(false)} />
            <div className={styles.popup}>
              {hasFollowed && setMyTeamsOnly && (
                <label className={styles.toggleRow}>
                  <span className={styles.toggleLabel}>My teams only</span>
                  <span className={`${styles.toggle} ${myTeamsOnly ? styles.toggleOn : ''}`}
                    onClick={() => setMyTeamsOnly(!myTeamsOnly)}
                    role="switch"
                    aria-checked={myTeamsOnly}
                  >
                    <span className={styles.toggleThumb} />
                  </span>
                </label>
              )}
              <select value={filters.division} onChange={e => updateFilter('division', e.target.value as DivisionFilter)}>
                <option value="all">All Divisions</option>
                <option value="RM">Real Mixed</option>
                <option value="LM">Loose Mixed</option>
                <option value="O">Open</option>
                <option value="W">Women</option>
                <option value="U20">U20</option>
                <option value="U15">U15</option>
              </select>
              <select value={filters.field} onChange={e => updateFilter('field', e.target.value)}>
                {availableFields.map(f => <option key={f} value={f}>{f === 'all' ? 'All Fields' : f}</option>)}
              </select>
              <select value={filters.country} onChange={e => updateFilter('country', e.target.value)}>
                <option value="all">All Countries</option>
                {availableCountries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filters.status} onChange={e => updateFilter('status', e.target.value as StatusFilter)}>
                <option value="all">All Status</option>
                <option value="played">Played</option>
                <option value="upcoming">Upcoming</option>
              </select>
              {activeCount > 0 && (
                <button onClick={() => { clearFilters(); setMyTeamsOnly?.(false); }} className={styles.clearBtn}>
                  Clear filters
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
