import { useState, useCallback, useRef } from 'react';

type SetValue<T> = T | ((prev: T) => T);

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: SetValue<T>) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Keep a ref to the current value so functional updaters work in stable callbacks
  const valueRef = useRef(storedValue);
  valueRef.current = storedValue;

  const setValue = useCallback((value: SetValue<T>) => {
    const newValue = typeof value === 'function'
      ? (value as (prev: T) => T)(valueRef.current)
      : value;
    valueRef.current = newValue;
    setStoredValue(newValue);
    try {
      window.localStorage.setItem(key, JSON.stringify(newValue));
    } catch {}
  }, [key]);

  return [storedValue, setValue];
}
