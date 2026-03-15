import { useState, useEffect } from 'react';
import type { PoolStandings } from '../types/pool';
import { fetchPools } from '../services/poolsService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import DivisionTabs from '../components/pools/DivisionTabs';
import PoolTable from '../components/pools/PoolTable';
import styles from '../styles/Pools.module.css';

export default function PoolsPage() {
  const [poolStandings, setPoolStandings] = useState<PoolStandings[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>('Real Mixed');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPools();
  }, []);

  const loadPools = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPools();
      setPoolStandings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pools');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadPools} />;

  const divisions = poolStandings.map(ps => ps.division);
  const currentPools = poolStandings.find(ps => ps.division === selectedDivision)?.pools || [];

  return (
    <div className={styles.poolsPage}>
      <div className={styles.header}>
        <h1>Pool Standings</h1>
        <p>Tournament standings by division</p>
      </div>

      <DivisionTabs
        divisions={divisions}
        selectedDivision={selectedDivision}
        onSelectDivision={setSelectedDivision}
      />

      <PoolTable pools={currentPools} />
    </div>
  );
}
