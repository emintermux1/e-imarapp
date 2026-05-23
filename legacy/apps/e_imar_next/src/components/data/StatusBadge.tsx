'use client';

import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  CircleX,
  Hourglass,
  KeyRound,
  Loader2,
  ScrollText,
  ShieldAlert,
  WifiOff,
} from 'lucide-react';
import type { ReadinessState, ReadinessTone } from '@/types/readiness';
import { readinessLabel, readinessTone } from '@/lib/utils/readiness';
import { cn } from '@/lib/utils/cn';
import type { ReactNode } from 'react';

interface StatusBadgeProps {
  status?: ReadinessState | null;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
  children?: ReactNode;
  className?: string;
}

const TONE_CLASSES: Record<ReadinessTone, string> = {
  success: 'bg-state-success/10 text-state-success border-state-success/20',
  warn: 'bg-state-warn/10 text-state-warn border-state-warn/20',
  danger: 'bg-state-gov-red/10 text-state-gov-red border-state-gov-red/20',
  info: 'bg-state-info/10 text-state-info border-state-info/20',
  neutral: 'bg-bg-subtle text-text-secondary border-border-subtle',
};

const SIZE_CLASSES = {
  xs: 'h-5 px-1.5 text-[11px] gap-1',
  sm: 'h-6 px-2 text-[12px] gap-1.5',
  md: 'h-7 px-2.5 text-[13px] gap-1.5',
};

function StatusIcon({ status }: { status?: ReadinessState | null }) {
  if (!status) return <CircleHelp className="h-3 w-3" aria-hidden />;
  switch (status) {
    case 'ok':
      return <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />;
    case 'loading':
      return <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />;
    case 'requires_credentials':
      return <KeyRound className="h-3.5 w-3.5" aria-hidden />;
    case 'requires_legal_agreement':
      return <ScrollText className="h-3.5 w-3.5" aria-hidden />;
    case 'captcha_required':
      return <ShieldAlert className="h-3.5 w-3.5" aria-hidden />;
    case 'rate_limited':
      return <Hourglass className="h-3.5 w-3.5" aria-hidden />;
    case 'network_error':
      return <WifiOff className="h-3.5 w-3.5" aria-hidden />;
    case 'unavailable':
    case 'invalid_input':
    case 'invalid':
    case 'unsupported':
    case 'unsupported_format':
    case 'provider_error':
      return <CircleX className="h-3.5 w-3.5" aria-hidden />;
    case 'not_ready':
    case 'requires_geocoder':
    case 'requires_data':
    case 'partial':
      return <AlertTriangle className="h-3.5 w-3.5" aria-hidden />;
    case 'empty':
    case 'idle':
    default:
      return <CircleHelp className="h-3.5 w-3.5" aria-hidden />;
  }
}

export function StatusBadge({
  status,
  size = 'sm',
  showIcon = true,
  children,
  className,
}: StatusBadgeProps) {
  const tone = readinessTone(status);
  const label = children ?? readinessLabel(status);
  return (
    <span
      data-status={status ?? 'unknown'}
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        TONE_CLASSES[tone],
        SIZE_CLASSES[size],
        className,
      )}
    >
      {showIcon ? <StatusIcon status={status} /> : null}
      <span className="leading-none">{label}</span>
    </span>
  );
}
