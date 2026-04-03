import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchSchedule, getFlag, onScheduleUpdate } from '../services/scheduleService';
import { getTodayString, formatTime } from '../utils/time';
import type { Match } from '../types/match';
import styles from './MapPage.module.css';

const FH = 52;    // field height
const FW = 200;   // field width
const GAP = 4;
const PAD = 12;
const SEA_W = 50;
const FIELD_X = SEA_W + 30;

function fy(i: number) { return PAD + i * (FH + GAP); }

// Reversed: 25 at top (idx 0), 1 at bottom — matches rotated beach map with sea on left
const TOP: { id: string; label: string; idx: number; arena?: boolean }[] = [
  ...Array.from({ length: 11 }, (_, i) => ({ id: String(25 - i), label: String(25 - i), idx: i })),
  { id: 'A', label: 'A', idx: 11, arena: true },
  ...Array.from({ length: 7 }, (_, i) => ({ id: String(14 - i), label: String(14 - i), idx: i + 12 })),
  { id: '7', label: '7j', idx: 19 },
  { id: '6', label: '6j', idx: 20 },
  ...Array.from({ length: 5 }, (_, i) => ({ id: String(5 - i), label: String(5 - i), idx: i + 21 })),
];

const SVG_W = FIELD_X + FW + PAD + 60;
const SVG_H = PAD * 2 + TOP.length * (FH + GAP) - GAP;

const DIV_COLORS: Record<string, string> = {
  RM: '#E30613', LM: '#d97706', O: '#009fe3',
  W: '#db2777', U20: '#059669', U15: '#7c3aed',
};

function norm(field: string): string {
  const f = field.trim().toLowerCase();
  if (f.includes('arena')) return 'A';
  return f.replace(/^field\s*/, '');
}

function findSlot(matches: Match[], day: string): string | null {
  const slots = [...new Set(matches.filter(m => m.day === day).map(m => m.time))].sort();
  if (!slots.length) return null;
  const now = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  for (const s of slots) {
    const m = s.match(/^(\d{1,2}):(\d{2})/);
    if (m && parseInt(m[1]) * 60 + parseInt(m[2]) + 45 >= nowM) return s;
  }
  return slots[slots.length - 1];
}

export default function MapPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [, setParams] = useSearchParams();
  // Read URL params once at mount
  const initParams = useRef(new URLSearchParams(window.location.search));
  const initField = useRef(initParams.current.get('field'));
  const initTime = useRef(initParams.current.get('time'));
  const [selected, setSelected] = useState<string | null>(
    initField.current ? norm(initField.current) : null
  );
  const [selectedSlot, setSelectedSlot] = useState<string | null>(initTime.current);
  const fieldRefs = useRef<Map<string, SVGGElement>>(new Map());

  // Clear URL params immediately so they don't interfere with user interaction
  useEffect(() => {
    if (initField.current || initTime.current) {
      setParams({}, { replace: true });
    }
  }, [setParams]);

  useEffect(() => {
    fetchSchedule().then(setMatches).catch(() => {});
    return onScheduleUpdate(setMatches);
  }, []);

  const today = getTodayString();
  const autoSlot = useMemo(() => findSlot(matches, today), [matches, today]);
  const slot = selectedSlot || autoSlot;

  const timeSlots = useMemo(() => {
    const set = new Set<string>();
    matches.filter(m => m.day === today).forEach(m => set.add(m.time));
    return Array.from(set).sort();
  }, [matches, today]);

  // Auto-select current slot if none from URL
  useEffect(() => {
    if (!selectedSlot && autoSlot) setSelectedSlot(autoSlot);
  }, [autoSlot, selectedSlot]);

  // Scroll to highlighted field once data loads
  useEffect(() => {
    if (!initField.current || !matches.length) return;
    const id = norm(initField.current);
    const el = fieldRefs.current.get(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    initField.current = null;
  }, [matches]);

  const fm = useMemo(() => {
    const map = new Map<string, Match[]>();
    if (!slot) return map;
    for (const m of matches) {
      if (m.day !== today || m.time !== slot) continue;
      const id = norm(m.field);
      if (!map.has(id)) map.set(id, []);
      map.get(id)!.push(m);
    }
    return map;
  }, [matches, today, slot]);

  const selMatches = selected ? (fm.get(selected) || []) : [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Field Map</h1>
      </div>

      {/* Time slot tabs */}
      <div className={styles.slotTabs}>
        {timeSlots.map(s => (
          <button
            key={s}
            className={`${styles.slotTab} ${slot === s ? styles.slotTabActive : ''}`}
            onClick={() => { setSelectedSlot(s); setSelected(null); }}
          >
            {formatTime(s)}
          </button>
        ))}
      </div>

      <div className={styles.legend}>
        {Object.entries(DIV_COLORS).map(([d, c]) => (
          <span key={d} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: c }} />
            {d}
          </span>
        ))}
      </div>

      <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} className={styles.map}>
        {/* Sea strip on left */}
        <rect x={0} y={0} width={SEA_W} height={SVG_H} fill="#b8e3f5" />
        <text x={SEA_W / 2} y={SVG_H / 2} textAnchor="middle" dominantBaseline="central"
          fill="#7cbdd6" fontSize="10" fontWeight="600" letterSpacing="2"
          transform={`rotate(-90, ${SEA_W / 2}, ${SVG_H / 2})`}
        >SEA</text>

        {/* Beach */}
        <rect x={SEA_W} y={0} width={SVG_W - SEA_W} height={SVG_H} fill="#f5e6c8" />

        {/* Fields */}
        {TOP.map(f => {
          const y = fy(f.idx);
          const has = fm.has(f.id);
          const m = fm.get(f.id)?.[0];
          const dc = m ? DIV_COLORS[m.division] : undefined;
          const sel = selected === f.id;

          return (
            <g
              key={f.id}
              ref={el => { if (el) fieldRefs.current.set(f.id, el); }}
              onClick={() => setSelected(sel ? null : f.id)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={FIELD_X} y={y} width={FW} height={FH} rx={6}
                fill={has ? (dc || '#aaa') : '#fff'}
                fillOpacity={has ? 0.15 : 0.55}
                stroke={sel ? '#009fe3' : has ? (dc || '#ccc') : '#d4c9a8'}
                strokeWidth={sel ? 2.5 : has ? 1.5 : 0.75}
              />
              {/* Field number */}
              <text
                x={FIELD_X + 18} y={y + FH / 2}
                textAnchor="middle" dominantBaseline="central"
                fill={has ? '#1a1a1a' : '#bbb'}
                fontSize={f.arena ? 16 : 14} fontWeight={700}
              >
                {f.label}
              </text>
              {/* Match info inside field */}
              {has && m && (
                <g clipPath={`url(#clip-${f.id})`}>
                  <clipPath id={`clip-${f.id}`}>
                    <rect x={FIELD_X + 34} y={y} width={FW - 38} height={FH} />
                  </clipPath>
                  <text
                    x={FIELD_X + 38} y={y + 18}
                    fill="#1a1a1a" fontSize="9" fontWeight="600"
                  >
                    {m.team1} vs {m.team2}
                  </text>
                  <text
                    x={FIELD_X + 38} y={y + 34}
                    fill={dc || '#666'} fontSize="8" fontWeight="500"
                  >
                    {m.matchType}
                  </text>
                </g>
              )}
              {/* Division dot */}
              {has && (
                <circle cx={FIELD_X - 8} cy={y + FH / 2} r={4} fill={dc || '#009fe3'} />
              )}
            </g>
          );
        })}

        {/* Arena + Eurodisc labels */}
        {(() => {
          const ay = fy(11);
          return (
            <>
              <text x={FIELD_X + FW + 8} y={ay + FH / 2 - 6} dominantBaseline="central"
                fill="#8a6d2b" fontSize="7" fontWeight="600"
              >EURODISC</text>
              <text x={FIELD_X + FW + 8} y={ay + FH / 2 + 6} dominantBaseline="central"
                fill="#8a6d2b" fontSize="8" fontWeight="700"
              >ARENA</text>
            </>
          );
        })()}

        {/* Paga Village marker */}
        {(() => {
          const vy = fy(11) + FH + 2;
          return (
            <text x={FIELD_X + FW + 8} y={vy + 4} fill="#8a6d2b" fontSize="7" fontWeight="600">PAGA VILLAGE</text>
          );
        })()}
      </svg>

      {/* Detail overlay */}
      {selected && selMatches.length > 0 && (
        <div className={styles.detail}>
          <div className={styles.detailHead}>
            <span className={styles.detailField}>
              {selected === 'A' ? 'Paganello Arena' : `Field ${selected}`}
            </span>
            <button className={styles.detailClose} onClick={() => setSelected(null)}>&times;</button>
          </div>
          {selMatches.map(m => (
            <Link key={m.id} to={`/match/${m.id}`} className={styles.matchLink}>
              <span className={styles.teams}>
                {getFlag(m.team1)} {m.team1}
                <span className={styles.vs}>vs</span>
                {getFlag(m.team2)} {m.team2}
              </span>
              <span className={styles.meta}>{m.matchType}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
