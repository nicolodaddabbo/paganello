import { useEffect } from 'react';
import styles from './FaberEasterEgg.module.css';

const VIDEO_ID = 'FRCk7XRM3gc';
const THUMBNAIL = `https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`;
const EMBED_SRC = `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&list=RDFRCk7XRM3gc&start_radio=1`;

interface Props {
  onClose: () => void;
}

export default function FaberEasterEgg({ onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.bg} style={{ backgroundImage: `url(${THUMBNAIL})` }} />
      <div className={styles.content} onClick={e => e.stopPropagation()}>
        <div className={styles.playerWrapper}>
          <iframe
            className={styles.player}
            src={EMBED_SRC}
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="7 Cloni di Faber"
          />
        </div>
        <button className={styles.close} onClick={onClose}>✕ chiudi</button>
      </div>
    </div>
  );
}
