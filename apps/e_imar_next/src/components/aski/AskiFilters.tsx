'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarRange, Filter, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAskiStore } from '@/lib/store/aski-store';
import { trackEvent } from '@/lib/analytics/events';
import { PLAN_TYPE_OPTIONS } from './aski-utils';
import { cn } from '@/lib/utils/cn';

interface AskiFiltersProps {
  className?: string;
  /** Compact rendering for left sidebar / mobile contexts. */
  compact?: boolean;
}

/**
 * Filter bar for the askı haritası route. Inputs are debounced into the
 * shared store so the map and the suspension list share a single source of
 * truth. Whenever any field changes we emit `aski_filter_changed`.
 */
export function AskiFilters({ className, compact = false }: AskiFiltersProps) {
  const filters = useAskiStore((s) => s.filters);
  const setFilters = useAskiStore((s) => s.setFilters);
  const resetFilters = useAskiStore((s) => s.resetFilters);

  const [municipalityInput, setMunicipalityInput] = useState(
    filters.municipalityIds.join(', '),
  );

  // When the store is reset elsewhere, sync the local input to mirror it.
  useEffect(() => {
    setMunicipalityInput(filters.municipalityIds.join(', '));
  }, [filters.municipalityIds]);

  function commitMunicipalityIds(value: string) {
    const ids = value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    setFilters({ municipalityIds: ids });
    trackEvent('aski_filter_changed', {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      municipalityCount: ids.length,
      planTypeCount: filters.planTypes.length,
    });
  }

  const planTypeSelected = useMemo(() => new Set(filters.planTypes), [filters.planTypes]);

  function togglePlanType(value: string) {
    const next = new Set(planTypeSelected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    const planTypes = Array.from(next);
    setFilters({ planTypes });
    trackEvent('aski_filter_changed', {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      municipalityCount: filters.municipalityIds.length,
      planTypeCount: planTypes.length,
    });
  }

  function setDate(field: 'dateFrom' | 'dateTo', value: string) {
    const next = value || null;
    setFilters({ [field]: next });
    trackEvent('aski_filter_changed', {
      dateFrom: field === 'dateFrom' ? next : filters.dateFrom,
      dateTo: field === 'dateTo' ? next : filters.dateTo,
      municipalityCount: filters.municipalityIds.length,
      planTypeCount: filters.planTypes.length,
    });
  }

  return (
    <section
      aria-label="Askı filtreleri"
      className={cn(
        'rounded-md border border-border-subtle bg-bg-surface/95 p-3 shadow-panel backdrop-blur',
        className,
      )}
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-text-muted" aria-hidden />
          <h3 className="m-0 text-[12px] font-semibold uppercase tracking-wide text-text-muted">
            Askı filtreleri
          </h3>
        </div>
        <Button
          size="sm"
          variant="ghost"
          leftIcon={<RotateCcw className="h-3.5 w-3.5" aria-hidden />}
          onClick={() => {
            resetFilters();
            setMunicipalityInput('');
          }}
        >
          Sıfırla
        </Button>
      </header>

      <div
        className={cn(
          'grid gap-3',
          compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3',
        )}
      >
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            label="Başlangıç"
            value={filters.dateFrom ?? ''}
            onChange={(event) => setDate('dateFrom', event.target.value)}
            leftAdornment={<CalendarRange className="h-4 w-4" aria-hidden />}
            aria-label="Başlangıç tarihi"
          />
          <Input
            type="date"
            label="Bitiş"
            value={filters.dateTo ?? ''}
            onChange={(event) => setDate('dateTo', event.target.value)}
            leftAdornment={<CalendarRange className="h-4 w-4" aria-hidden />}
            aria-label="Bitiş tarihi"
          />
        </div>

        <Input
          label="Belediye ID(ler)"
          placeholder="Virgül ile ayırın (örn. tr-06, tr-34)"
          value={municipalityInput}
          onChange={(event) => setMunicipalityInput(event.target.value)}
          onBlur={(event) => commitMunicipalityIds(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              commitMunicipalityIds((event.target as HTMLInputElement).value);
            }
          }}
          hint="Boş bırakırsanız tüm belediyeler taranır"
        />

        <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
          <legend className="text-[13px] font-medium text-text-secondary">
            Plan türü
          </legend>
          <div
            className={cn(
              'flex flex-wrap gap-1.5 rounded-md border border-border bg-bg-surface px-2 py-2',
            )}
          >
            {PLAN_TYPE_OPTIONS.map((option) => {
              const active = planTypeSelected.has(option.value);
              return (
                <label
                  key={option.value}
                  className={cn(
                    'inline-flex cursor-pointer items-center gap-1.5 rounded-sm px-2 py-1 text-[12px] transition-colors',
                    'focus-within:shadow-focus',
                    active
                      ? 'bg-brand-navy/10 text-brand-navy'
                      : 'bg-bg-subtle text-text-secondary hover:bg-border-subtle',
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={active}
                    onChange={() => togglePlanType(option.value)}
                    aria-label={option.label}
                  />
                  <span
                    className={cn(
                      'inline-block h-2.5 w-2.5 rounded-full border',
                      active
                        ? 'border-brand-navy bg-brand-navy'
                        : 'border-border-strong bg-bg-surface',
                    )}
                    aria-hidden
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>
    </section>
  );
}
