import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return {
    theme,
    setTheme: (newTheme: 'light' | 'dark') => setTheme(newTheme),
    toggleTheme: () => setTheme(theme === 'light' ? 'dark' : 'light'),
  };
} 