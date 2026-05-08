'use client';

import { useMapStore } from '@/lib/store/map-store';
import type { LayerCatalogItem } from '@/types/map';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface LayerToggleProps {
  layer: LayerCatalogItem;
  className?: string;
  onToggle?: (id: string, nextEnabled: boolean) => void;
}

const SOURCE_LABEL: Record<LayerCatalogItem['source'], string> = {
  tucbs: 'TUCBS',
  municipal: 'Belediye',
  eplan: 'e-Plan',
  custom: 'Özel',
};

export function LayerToggle({ layer, className, onToggle }: LayerToggleProps) {
  const toggleLayer = useMapStore((s) => s.toggleLayer);
  const setOpacity = useMapStore((s) => s.setOpacity);
  const reduce = useReducedMotion();

  return (
    <div
      className={cn(
        'rounded-md border border-border-subtle bg-bg-surface px-3 py-2.5',
        layer.enabled && 'border-brand-muted-blue/40 bg-bg-surface',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={layer.enabled}
          onClick={() => {
            const nextEnabled = !layer.enabled;
            toggleLayer(layer.id, nextEnabled);
            onToggle?.(layer.id, nextEnabled);
          }}
          aria-label={`${layer.label} katmanını ${layer.enabled ? 'kapat' : 'aç'}`}
          className={cn(
            'relative mt-1 h-5 w-9 shrink-0 rounded-full border transition-colors',
            'focus-visible:shadow-focus focus-visible:outline-none',
            layer.enabled
              ? 'border-brand-navy bg-brand-navy'
              : 'border-border bg-bg-subtle',
          )}
        >
          <motion.span
            animate={{ x: layer.enabled ? 16 : 2 }}
            transition={reduce ? { duration: 0 } : { duration: 0.16, ease: [0.2, 0, 0, 1] }}
            className={cn(
              'absolute top-0.5 h-4 w-4 rounded-full bg-bg-surface shadow-sm',
              layer.enabled && 'bg-text-inverse',
            )}
          />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[13px] font-medium text-text-primary">{layer.label}</span>
            <span className="rounded-sm bg-bg-subtle px-1.5 py-0.5 font-data text-[10px] tracking-wide text-text-muted">
              {SOURCE_LABEL[layer.source]}
            </span>
          </div>
          <p className="m-0 mt-0.5 text-[11px] leading-4 text-text-muted">{layer.description}</p>
          <AnimatePresence>
            {layer.enabled ? (
              <motion.div
                key="opacity"
                initial={reduce ? false : { height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.18, ease: [0.2, 0, 0, 1] }}
                className="overflow-hidden"
              >
                <label className="mt-2 flex items-center gap-2 text-[11px] text-text-muted">
                  <span className="shrink-0">Opaklık</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={layer.opacity}
                    onChange={(event) => setOpacity(layer.id, Number(event.target.value))}
                    aria-label={`${layer.label} opaklık`}
                    className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-bg-subtle accent-brand-navy"
                  />
                  <span className="font-data tabular-nums">
                    {Math.round(layer.opacity * 100)}%
                  </span>
                </label>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
