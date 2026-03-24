import { useMemo } from 'react';
import type { Match } from '../../types/match';
import { formatTime } from '../../utils/time';
import { isPlaceholder } from '../../utils/match';
import styles from './BracketView.module.css';

interface Props {
  matches: Match[];
}

interface RoundGroup {
  key: string;
  label: string;
  order: number;
}

const ROUND_DEFS: RoundGroup[] = [
  { key: 'PQ', label: 'Pre-Quarters', order: 0 },
  { key: 'R', label: 'Ranking', order: 0 },
  { key: 'Q', label: 'Quarters', order: 1 },
  { key: 'S', label: 'Semis', order: 2 },
  { key: 'F', label: 'Finals', order: 3 },
];

function getRoundKey(matchType: string): string | null {
  // Extract round code: e.g. "RM PQ1 (1-16)" -> "PQ", "RM Q1 (1-8)" -> "Q"
  const m = matchType.match(/\b(PQ|Q|S|F|R)\d+\b/);
  return m ? m[1] : null;
}

function getPlacementRange(matchType: string): string {
  const m = matchType.match(/\(([^)]+)\)/);
  return m ? m[1] : '';
}

interface RoundData {
  label: string;
  order: number;
  placements: Map<string, Match[]>;
}

export default function BracketView({ matches }: Props) {
  const rounds = useMemo(() => {
    const roundMap = new Map<string, RoundData>();

    for (const match of matches) {
      const roundKey = getRoundKey(match.matchType);
      if (!roundKey) continue;

      const def = ROUND_DEFS.find(d => d.key === roundKey);
      if (!def) continue;

      if (!roundMap.has(roundKey)) {
        roundMap.set(roundKey, {
          label: def.label,
          order: def.order,
          placements: new Map(),
        });
      }

      const round = roundMap.get(roundKey)!;
      const placement = getPlacementRange(match.matchType);
      if (!round.placements.has(placement)) {
        round.placements.set(placement, []);
      }
      round.placements.get(placement)!.push(match);
    }

    return Array.from(roundMap.values()).sort((a, b) => a.order - b.order);
  }, [matches]);

  if (rounds.length === 0) {
    return <div className={styles.emptyRound}>No knockout matches yet</div>;
  }

  return (
    <div className={styles.bracket}>
      <div className={styles.bracketGrid}>
        {rounds.map(round => (
          <div key={round.label} className={styles.round}>
            <div className={styles.roundTitle}>{round.label}</div>
            {Array.from(round.placements.entries())
              .sort(([a], [b]) => {
                const na = parseInt(a) || 999;
                const nb = parseInt(b) || 999;
                return na - nb;
              })
              .map(([placement, matchList]) => (
                <div key={placement} className={styles.placementGroup}>
                  {placement && (
                    <div className={styles.placementLabel}>Places {placement}</div>
                  )}
                  {matchList.map(match => {
                    const t1Wins = match.hasScore && match.score1 > match.score2;
                    const t2Wins = match.hasScore && match.score2 > match.score1;
                    const t1Ph = isPlaceholder(match.team1);
                    const t2Ph = isPlaceholder(match.team2);

                    return (
                      <div key={match.id} className={styles.matchBox}>
                        <div className={styles.matchRow}>
                          <span className={`${styles.teamName} ${t1Wins ? styles.winner : ''} ${t1Ph ? styles.placeholder : ''}`}>
                            {match.team1}
                          </span>
                          <span className={`${styles.score} ${t1Wins ? styles.winScore : ''}`}>
                            {match.hasScore ? match.score1 : ''}
                          </span>
                        </div>
                        <div className={styles.matchRow}>
                          <span className={`${styles.teamName} ${t2Wins ? styles.winner : ''} ${t2Ph ? styles.placeholder : ''}`}>
                            {match.team2}
                          </span>
                          <span className={`${styles.score} ${t2Wins ? styles.winScore : ''}`}>
                            {match.hasScore ? match.score2 : ''}
                          </span>
                        </div>
                        <div className={styles.matchMeta}>
                          <span>{formatTime(match.time)}</span>
                          <span>{match.field}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
