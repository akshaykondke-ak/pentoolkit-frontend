'use client';

import { useTheme } from '@/lib/theme/ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-sm border transition-all duration-200 text-xs"
      style={{
        borderColor: 'var(--border-default)',
        backgroundColor: 'var(--bg-hover)',
        color: 'var(--text-muted)',
      }}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        /* Sun icon */
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <circle cx="6.5" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M6.5 1v1.5M6.5 10.5V12M1 6.5h1.5M10.5 6.5H12M2.636 2.636l1.06 1.06M9.304 9.304l1.06 1.06M9.304 3.696l-1.06 1.06M3.696 9.304l-1.06 1.06" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      ) : (
        /* Moon icon */
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M11 7.5A5 5 0 015.5 2a5 5 0 100 9 5 5 0 005.5-3.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      )}
      <span className="hidden sm:block">{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}