import type { Filters, DayFilter, DivisionFilter, StatusFilter } from '../../types/match';
import { getActiveFilterCount } from '../../utils/filters';
import styles from '../../styles/Schedule.module.css';

interface FilterBarProps {
  filters: Filters;
  updateFilter: (key: keyof Filters, value: string) => void;
  clearFilters: () => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  availableFields: string[];
  availableTimes: string[];
}

export default function FilterBar({
  filters,
  updateFilter,
  clearFilters,
  showFilters,
  setShowFilters,
  availableFields,
  availableTimes,
}: FilterBarProps) {
  const activeCount = getActiveFilterCount(filters);

  return (
    <div className={styles.filterBar}>
      <input
        type="text"
        placeholder="Search teams..."
        value={filters.search}
        onChange={(e) => updateFilter('search', e.target.value)}
        className={styles.searchInput}
      />

      <button
        className={styles.filterToggle}
        onClick={() => setShowFilters(!showFilters)}
      >
        Filters {activeCount > 0 && <span className={styles.badge}>{activeCount}</span>}
      </button>

      {showFilters && (
        <div className={styles.filterDropdown}>
          <div className={styles.filterGroup}>
            <label>Division</label>
            <select
              value={filters.division}
              onChange={(e) => updateFilter('division', e.target.value as DivisionFilter)}
            >
              <option value="all">All Divisions</option>
              <option value="RM">Real Mixed</option>
              <option value="LM">Loose Mixed</option>
              <option value="O">Open</option>
              <option value="W">Women</option>
              <option value="U20">U20</option>
              <option value="U15">U15</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Field</label>
            <select
              value={filters.field}
              onChange={(e) => updateFilter('field', e.target.value)}
            >
              {availableFields.map(field => (
                <option key={field} value={field}>
                  {field === 'all' ? 'All Fields' : field}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Day</label>
            <select
              value={filters.day}
              onChange={(e) => updateFilter('day', e.target.value as DayFilter)}
            >
              <option value="all">All Days</option>
              <option value="saturday">Saturday</option>
              <option value="sunday">Sunday</option>
              <option value="monday">Monday</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Time</label>
            <select
              value={filters.time}
              onChange={(e) => updateFilter('time', e.target.value)}
            >
              {availableTimes.map(time => (
                <option key={time} value={time}>
                  {time === 'all' ? 'All Times' : time}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value as StatusFilter)}
            >
              <option value="all">All Matches</option>
              <option value="played">Played</option>
              <option value="upcoming">Upcoming</option>
            </select>
          </div>

          <button onClick={clearFilters} className={styles.clearButton}>
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
