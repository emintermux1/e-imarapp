'use client';

import { ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface RiskIndicatorProps {
  /** 0-1 normalized risk score from backend. */
  score?: number | null;
  /** Optional label to override default. */
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

function riskTone(score?: number | null) {
  if (score === undefined || score === null || Number.isNaN(score)) {
    return {
      label: 'Risk verisi yok',
      tone: 'neutral' as const,
      icon: <ShieldAlert className="h-4 w-4" aria-hidden />,
      bg: 'bg-bg-subtle',
      text: 'text-text-secondary',
    };
  }
  if (score < 0.34) {
    return {
      label: 'Düşük risk',
      tone: 'low' as const,
      icon: <ShieldCheck className="h-4 w-4" aria-hidden />,
      bg: 'bg-state-success/10',
      text: 'text-state-success',
    };
  }
  if (score < 0.67) {
    return {
      label: 'Orta risk',
      tone: 'mid' as const,
      icon: <ShieldAlert className="h-4 w-4" aria-hidden />,
      bg: 'bg-state-warn/10',
      text: 'text-state-warn',
    };
  }
  return {
    label: 'Yüksek risk',
    tone: 'high' as const,
    icon: <ShieldX className="h-4 w-4" aria-hidden />,
    bg: 'bg-state-gov-red/10',
    text: 'text-state-gov-red',
  };
}

export function RiskIndicator({ score, label, className, size = 'md' }: RiskIndicatorProps) {
  const { icon, label: defaultLabel, bg, text } = riskTone(score);
  const display = label ?? defaultLabel;
  const percent = typeof score === 'number' && !Number.isNaN(score)
    ? Math.round(Math.max(0, Math.min(1, score)) * 100)
    : null;
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-md border border-border-subtle px-2.5',
        size === 'sm' ? 'h-7 text-[12px]' : 'h-9 text-[13px]',
        bg,
        text,
        className,
      )}
    >
      {icon}
      <span className="font-medium">{display}</span>
      {percent !== null ? (
        <span className="font-data tabular-nums opacity-80">{percent}/100</span>
      ) : null}
    </div>
  );
}
