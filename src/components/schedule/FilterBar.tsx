import { useState } from 'react';
import type { Filters, DayFilter, DivisionFilter, StatusFilter } from '../../types/match';
import { getActiveFilterCount } from '../../utils/filters';
import styles from './FilterBar.module.css';

interface Props {
  filters: Filters;
  updateFilter: (key: keyof Filters, value: string) => void;
  clearFilters: () => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  availableFields: string[];
  availableTimes: string[];
}

export default function FilterBar({
  filters, updateFilter, clearFilters,
  showFilters, setShowFilters,
  availableFields, availableTimes,
}: Props) {
  const activeCount = getActiveFilterCount(filters);

  return (
    <>
      <div className={styles.row}>
        <input
          type="text"
          placeholder="Search teams..."
          value={filters.search}
          onChange={e => updateFilter('search', e.target.value)}
          className={styles.search}
        />
        <button className={styles.filterBtn} onClick={() => setShowFilters(!showFilters)}>
          Filters{activeCount > 0 && <span className={styles.badge}>{activeCount}</span>}
        </button>
      </div>

      {showFilters && (
        <div className={styles.filters}>
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
          <select value={filters.status} onChange={e => updateFilter('status', e.target.value as StatusFilter)}>
            <option value="all">All Status</option>
            <option value="played">Played</option>
            <option value="upcoming">Upcoming</option>
          </select>
          {activeCount > 0 && (
            <button onClick={clearFilters} className={styles.clearBtn}>Clear</button>
          )}
        </div>
      )}
    </>
  );
}
