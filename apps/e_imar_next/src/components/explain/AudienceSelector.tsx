'use client';

import { Users, HardHat, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Audience } from '@/lib/api/types';

interface AudienceSelectorProps {
  value: Audience | undefined;
  onChange: (next: Audience) => void;
  className?: string;
  disabled?: boolean;
}

interface AudienceOption {
  id: Audience;
  label: string;
  hint: string;
  icon: React.ReactNode;
}

const OPTIONS: AudienceOption[] = [
  {
    id: 'citizen',
    label: 'Vatandaş',
    hint: 'Sade dil, jargon yok',
    icon: <Users className="h-4 w-4" aria-hidden />,
  },
  {
    id: 'architect',
    label: 'Mimar',
    hint: 'Plan terminolojisi, teknik detay',
    icon: <HardHat className="h-4 w-4" aria-hidden />,
  },
  {
    id: 'investor',
    label: 'Yatırımcı',
    hint: 'Risk ve fırsat odaklı',
    icon: <TrendingUp className="h-4 w-4" aria-hidden />,
  },
];

export function AudienceSelector({
  value,
  onChange,
  className,
  disabled,
}: AudienceSelectorProps) {
  return (
    <fieldset className={cn('m-0 border-0 p-0', className)}>
      <legend className="text-[13px] font-medium text-text-secondary">Hedef kitle</legend>
      <div
        role="radiogroup"
        aria-label="Hedef kitle"
        className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-3"
      >
        {OPTIONS.map((option) => {
          const checked = option.id === value;
          return (
            <label
              key={option.id}
              className={cn(
                'flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-[12px] transition-colors',
                'focus-within:shadow-focus',
                checked
                  ? 'border-brand-navy bg-brand-navy/5 text-text-primary'
                  : 'border-border bg-bg-surface text-text-secondary hover:border-border-strong',
                disabled && 'cursor-not-allowed opacity-60',
              )}
            >
              <input
                type="radio"
                name="audience"
                value={option.id}
                disabled={disabled}
                checked={checked}
                onChange={() => onChange(option.id)}
                className="sr-only"
              />
              <span
                className={cn(
                  'mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md',
                  checked ? 'bg-brand-navy/10 text-brand-navy' : 'bg-bg-subtle text-text-muted',
                )}
                aria-hidden
              >
                {option.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{option.label}</span>
                <span className="mt-0.5 block text-[11px] text-text-muted">{option.hint}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
