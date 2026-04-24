'use client';

import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';

  return (
    <button
      type="button"
      className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-primary px-3 text-xs font-medium text-primary transition-colors duration-200 hover:bg-primary hover:text-primary-foreground"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? 'Light' : 'Dark'}
    </button>
  );
}
