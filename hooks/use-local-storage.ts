"use client";

import { useState, useEffect } from 'react';

/**
 * Ein Custom Hook, der den Zustand mit dem localStorage des Browsers synchronisiert.
 * @param key Der Schlüssel, unter dem der Wert im localStorage gespeichert wird.
 * @param initialValue Der Anfangswert, falls im localStorage noch nichts gespeichert ist.
 * @returns Ein State-Tupel [value, setValue], genau wie bei React.useState.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    // Diese Funktion wird nur beim ersten Rendern ausgeführt, um den initialen Zustand zu laden.
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      // Wenn ein Wert gefunden wird, wird er geparst, ansonsten wird der initialValue verwendet.
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Fehler beim Lesen des localStorage-Schlüssels “${key}”:`, error);
      return initialValue;
    }
  });

  // Dieser Effekt wird immer dann ausgeführt, wenn sich der Wert ändert.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Speichert den aktuellen Wert im localStorage.
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Fehler beim Setzen des localStorage-Schlüssels “${key}”:`, error);
      }
    }
  }, [key, value]);

  return [value, setValue];
}
