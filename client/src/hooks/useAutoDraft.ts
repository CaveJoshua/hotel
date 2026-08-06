import { useState, useEffect } from 'react';

export function useAutoDraft(key, initialValue) {
  const storageKey = `resort_draft_${key}`;

  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch {}
    return typeof initialValue === 'function' ? initialValue() : initialValue;
  });

  useEffect(() => {
    try {
      if (value !== undefined && value !== null) {
        localStorage.setItem(storageKey, JSON.stringify(value));
      }
    } catch {}
  }, [storageKey, value]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  };

  return [value, setValue, clearDraft];
}
