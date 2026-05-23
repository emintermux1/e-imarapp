'use client';

import { Building, Factory, Home, Sprout, TreePalm } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface ZoningBadgeProps {
  zoning?: string | null;
  className?: string;
  size?: 'sm' | 'md';
}

interface ZoningStyle {
  bg: string;
  text: string;
  icon: ReactNode;
}

function classifyZoning(zoning?: string | null): { key: string; style: ZoningStyle } {
  if (!zoning) {
    return {
      key: 'unknown',
      style: {
        bg: 'bg-bg-subtle',
        text: 'text-text-secondary',
        icon: <Sprout className="h-3.5 w-3.5" aria-hidden />,
      },
    };
  }
  const z = zoning.toLowerCase();
  if (z.includes('konut') || z.includes('residential')) {
    return {
      key: 'konut',
      style: {
        bg: 'bg-state-info/10',
        text: 'text-state-info',
        icon: <Home className="h-3.5 w-3.5" aria-hidden />,
      },
    };
  }
  if (z.includes('ticari') || z.includes('ticaret') || z.includes('commercial')) {
    return {
      key: 'ticari',
      style: {
        bg: 'bg-state-warn/10',
        text: 'text-state-warn',
        icon: <Building className="h-3.5 w-3.5" aria-hidden />,
      },
    };
  }
  if (z.includes('sanayi') || z.includes('endüstri') || z.includes('industrial')) {
    return {
      key: 'sanayi',
      style: {
        bg: 'bg-state-gov-red/10',
        text: 'text-state-gov-red',
        icon: <Factory className="h-3.5 w-3.5" aria-hidden />,
      },
    };
  }
  if (z.includes('park') || z.includes('yeşil') || z.includes('orman')) {
    return {
      key: 'yesil',
      style: {
        bg: 'bg-state-success/10',
        text: 'text-state-success',
        icon: <TreePalm className="h-3.5 w-3.5" aria-hidden />,
      },
    };
  }
  return {
    key: 'other',
    style: {
      bg: 'bg-bg-subtle',
      text: 'text-text-secondary',
      icon: <Sprout className="h-3.5 w-3.5" aria-hidden />,
    },
  };
}

export function ZoningBadge({ zoning, className, size = 'sm' }: ZoningBadgeProps) {
  const { style } = classifyZoning(zoning);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'h-6 px-2 text-[12px]' : 'h-7 px-3 text-[13px]',
        style.bg,
        style.text,
        className,
      )}
    >
      {style.icon}
      <span className="leading-none">{zoning ?? 'Tanımlanmamış'}</span>
    </span>
  );
}
