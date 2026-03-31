import { useEffect, useRef, useState } from 'react';

export const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const hasHydratedThemeRef = useRef(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('theme');
    const resolvedTheme: 'light' | 'dark' =
      storedTheme === 'light' || storedTheme === 'dark'
        ? storedTheme
        : window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';

    hasHydratedThemeRef.current = true;
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    window.localStorage.setItem('theme', resolvedTheme);

    if (resolvedTheme !== 'light') {
      const timeoutId = window.setTimeout(() => {
        setTheme(resolvedTheme);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedThemeRef.current) return;
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
  };

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
  };
};
