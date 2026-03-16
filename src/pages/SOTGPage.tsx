import { useState } from 'react';
import styles from './SOTGPage.module.css';

const CATEGORIES = [
  { key: 'rules', label: 'Rules Knowledge & Use' },
  { key: 'fouls', label: 'Fouls & Body Contact' },
  { key: 'fairMindedness', label: 'Fair-Mindedness' },
  { key: 'positiveAttitude', label: 'Positive Attitude & Self-Control' },
  { key: 'communication', label: 'Communication' },
] as const;

const SCORES = [0, 1, 2, 3, 4];

export default function SOTGPage() {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [opponent, setOpponent] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const total = Object.values(scores).reduce((sum, v) => sum + v, 0);
  const allScored = CATEGORIES.every(c => scores[c.key] !== undefined);

  const handleSubmit = () => {
    if (!allScored || !opponent) return;
    // Store in localStorage for now (would POST to Google Apps Script)
    const pending = JSON.parse(localStorage.getItem('paganello-sotg-pending') || '[]');
    pending.push({ opponent, scores, comment, total, timestamp: Date.now() });
    localStorage.setItem('paganello-sotg-pending', JSON.stringify(pending));
    setSubmitted(true);
  };

  const reset = () => {
    setScores({});
    setComment('');
    setOpponent('');
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className={styles.page}>
        <div className={styles.success}>
          <h2>Score Submitted</h2>
          <p>Spirit score of {total}/20 for {opponent}</p>
          <button className={styles.primaryBtn} onClick={reset}>Submit Another</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Spirit of the Game</h1>
      <p className={styles.subtitle}>Rate your opponent after each game</p>

      <div className={styles.field}>
        <label className={styles.label}>Opponent Team</label>
        <input
          type="text"
          placeholder="Enter team name..."
          value={opponent}
          onChange={e => setOpponent(e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.categories}>
        {CATEGORIES.map(cat => (
          <div key={cat.key} className={styles.category}>
            <div className={styles.catLabel}>{cat.label}</div>
            <div className={styles.scoreRow}>
              {SCORES.map(s => (
                <button
                  key={s}
                  className={`${styles.scoreBtn} ${scores[cat.key] === s ? styles.scoreBtnActive : ''}`}
                  onClick={() => setScores({ ...scores, [cat.key]: s })}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className={styles.scaleLabels}>
              <span>Poor</span>
              <span>Good</span>
              <span>Excellent</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>Total</span>
        <span className={styles.totalValue}>{total}/20</span>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Comments (optional)</label>
        <textarea
          placeholder="Any additional feedback..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          className={styles.textarea}
          rows={3}
        />
      </div>

      <button
        className={styles.primaryBtn}
        onClick={handleSubmit}
        disabled={!allScored || !opponent}
      >
        Submit Spirit Score
      </button>
    </div>
  );
}
