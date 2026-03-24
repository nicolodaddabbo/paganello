import { useState, useEffect, useRef } from 'react';

interface Countdown {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
  display: string;
}

export function useCountdown(targetDate: Date | null): Countdown {
  const targetTime = targetDate?.getTime() ?? null;
  const [countdown, setCountdown] = useState<Countdown>(() => calculate(targetTime));
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (targetTime === null) return;

    const update = () => {
      const result = calculate(targetTime);
      setCountdown(result);
      if (result.isExpired && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    update();

    intervalRef.current = setInterval(update, 1000);
    return () => clearInterval(intervalRef.current);
  }, [targetTime]);

  return countdown;
}

function calculate(targetTime: number | null): Countdown {
  if (targetTime === null) {
    return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isExpired: true, display: '--:--' };
  }

  const diff = targetTime - Date.now();
  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isExpired: true, display: '0:00' };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const display = hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${minutes}:${pad(seconds)}`;

  return { hours, minutes, seconds, totalSeconds, isExpired: false, display };
}
