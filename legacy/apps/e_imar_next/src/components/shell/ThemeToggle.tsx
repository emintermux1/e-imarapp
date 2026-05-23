'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { trackEvent } from '@/lib/analytics/events';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';
  return (
    <IconButton
      aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
      variant="ghost"
      onClick={() => {
        const next = isDark ? 'light' : 'dark';
        setTheme(next);
        trackEvent('theme_toggled', { theme: next });
      }}
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-4 w-4" aria-hidden />
        ) : (
          <Moon className="h-4 w-4" aria-hidden />
        )
      ) : (
        <Moon className="h-4 w-4" aria-hidden />
      )}
    </IconButton>
  );
}
