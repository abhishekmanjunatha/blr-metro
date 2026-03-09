import { useEffect, useState, useCallback } from 'react';
import { usePreferencesStore } from '../store';

/**
 * Hook to manage theme (dark/light mode)
 */
export function useTheme() {
  const theme = usePreferencesStore((state) => state.theme);
  const setTheme = usePreferencesStore((state) => state.setTheme);
  const getEffectiveTheme = usePreferencesStore((state) => state.getEffectiveTheme);
  const [effectiveTheme, setEffectiveTheme] = useState('light');
  
  // Update effective theme when preference or system changes
  useEffect(() => {
    const updateTheme = () => {
      let newTheme = 'light';
      try {
        newTheme = getEffectiveTheme();
      } catch (e) {
        console.error('Error getting theme:', e);
      }
      setEffectiveTheme(newTheme);
      
      // Update document class for Tailwind dark mode
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Update meta theme-color
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', newTheme === 'dark' ? '#1A1A1A' : '#8B008B');
      }
    };
    
    updateTheme();
    
    // Listen for system preference changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => updateTheme();
      
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme, getEffectiveTheme]);
  
  const toggleTheme = useCallback(() => {
    const current = getEffectiveTheme();
    setTheme(current === 'dark' ? 'light' : 'dark');
  }, [setTheme, getEffectiveTheme]);
  
  const cycleTheme = useCallback(() => {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }, [theme, setTheme]);
  
  return {
    theme,
    effectiveTheme,
    isDark: effectiveTheme === 'dark',
    setTheme,
    toggleTheme,
    cycleTheme
  };
}

/**
 * Hook to detect system color scheme preference
 */
export function useSystemTheme() {
  const [systemTheme, setSystemTheme] = useState('light');
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handler = (e) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    
    // Set initial value
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    
    // Listen for changes
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return systemTheme;
}
