import { useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'site-survey-theme';

export function useThemeMode() {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const nextMode: ThemeMode = stored || (prefersDark ? 'dark' : 'light');
    setMode(nextMode);
    document.documentElement.classList.toggle('dark', nextMode === 'dark');
  }, []);

  function toggleTheme() {
    const nextMode: ThemeMode = mode === 'dark' ? 'light' : 'dark';
    setMode(nextMode);
    localStorage.setItem(STORAGE_KEY, nextMode);
    document.documentElement.classList.toggle('dark', nextMode === 'dark');
  }

  return { mode, toggleTheme };
}
