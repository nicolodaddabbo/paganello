import type { Pool } from '../../types/pool';
import styles from '../../styles/Pools.module.css';

interface PoolTableProps {
  pools: Pool[];
}

export default function PoolTable({ pools }: PoolTableProps) {
  if (pools.length === 0) {
    return <p className={styles.noData}>No pool data available for this division.</p>;
  }

  return (
    <div className={styles.poolsContainer}>
      {pools.map((pool, index) => (
        <div key={index} className={styles.poolCard}>
          <h3 className={styles.poolName}>{pool.poolName}</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.poolTable}>
              <thead>
                <tr>
                  <th>Team</th>
                  <th>PT</th>
                  <th>W</th>
                  <th>L</th>
                  <th>P</th>
                  <th>GS</th>
                  <th>GA</th>
                  <th>GD</th>
                </tr>
              </thead>
              <tbody>
                {pool.teams
                  .sort((a, b) => b.PT - a.PT)
                  .map((team, teamIndex) => (
                    <tr key={teamIndex}>
                      <td className={styles.teamName}>{team.TEAM}</td>
                      <td>{team.PT}</td>
                      <td>{team.W}</td>
                      <td>{team.L}</td>
                      <td>{team.P}</td>
                      <td>{team.GS}</td>
                      <td>{team.GA}</td>
                      <td>{team.GD}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
