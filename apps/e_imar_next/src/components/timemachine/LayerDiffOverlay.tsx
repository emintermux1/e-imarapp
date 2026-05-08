'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { GitCompareArrows } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapStore } from '@/lib/store/map-store';
import { useTimemachineStore } from '@/lib/store/timemachine-store';
import { resolveMapStyle } from '@/lib/map/styles';
import { Skeleton } from '@/components/data/Skeleton';
import { StatusBanner } from '@/components/data/StatusBanner';
import { trackEvent } from '@/lib/analytics/events';
import { cn } from '@/lib/utils/cn';
import type { Map as MapLibreMap, StyleSpecification } from 'maplibre-gl';

interface LayerDiffOverlayProps {
  className?: string;
  beforeLabel?: string;
  afterLabel?: string;
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function MapInner({ className, beforeLabel = 'Önce', afterLabel = 'Sonra' }: LayerDiffOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const [tileError, setTileError] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const center = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);
  const bearing = useMapStore((s) => s.bearing);
  const pitch = useMapStore((s) => s.pitch);
  const mapStyle = useMapStore((s) => s.mapStyle);
  const setView = useMapStore((s) => s.setView);

  const comparePosition = useTimemachineStore((s) => s.comparePosition);
  const setComparePosition = useTimemachineStore((s) => s.setComparePosition);
  const fromAt = useTimemachineStore((s) => s.fromAt);
  const toAt = useTimemachineStore((s) => s.toAt);

  const [dragging, setDragging] = useState(false);

  // Mount the basemap.
  useEffect(() => {
    if (!containerRef.current) return;
    let map: MapLibreMap | null = null;
    let cancelled = false;
    (async () => {
      const maplibregl = (await import('maplibre-gl')).default;
      if (cancelled || !containerRef.current) return;
      const style = resolveMapStyle(mapStyle);
      map = new maplibregl.Map({
        container: containerRef.current,
        style: style as string | StyleSpecification,
        center,
        zoom,
        bearing,
        pitch,
        attributionControl: { compact: true },
      });
      mapRef.current = map;
      map.on('load', () => setStyleLoaded(true));
      map.on('error', (event) => {
        if (event?.error && 'message' in event.error) {
          setTileError((event.error as Error).message);
        }
      });
      map.on('moveend', () => {
        if (!map) return;
        const c = map.getCenter();
        setView({
          center: [c.lng, c.lat],
          zoom: map.getZoom(),
          bearing: map.getBearing(),
          pitch: map.getPitch(),
        });
      });
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const style = resolveMapStyle(mapStyle);
    setStyleLoaded(false);
    map.setStyle(style as string | StyleSpecification);
    map.once('load', () => setStyleLoaded(true));
  }, [mapStyle]);

  function dragMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const next = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    setComparePosition(next);
    trackEvent('timemachine_compare_moved', { position: next });
  }

  return (
    <div
      ref={wrapperRef}
      className={cn('relative h-full w-full overflow-hidden bg-bg-subtle', className)}
      onPointerMove={dragMove}
      onPointerUp={() => setDragging(false)}
      onPointerLeave={() => setDragging(false)}
    >
      <div ref={containerRef} className="absolute inset-0" />
      <AnimatePresence>
        {!styleLoaded ? (
          <motion.div
            key="map-skeleton"
            initial={reduce ? false : { opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.16 }}
            className="absolute inset-0 grid place-items-center bg-bg-subtle"
          >
            <Skeleton className="h-32 w-32" rounded="lg" />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Side labels — backend would supply geometry layers; without geometry
          we still keep the labels so the user can see which side maps to
          which snapshot.  No fabricated polygons are drawn. */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {/* "After" side overlay (right) — clipped via clip-path */}
        <div
          className="absolute inset-0 bg-state-gov-red/0"
          style={{
            clipPath: `inset(0 0 0 ${comparePosition * 100}%)`,
          }}
          aria-hidden
        />
        {/* "Before" side overlay (left) — clipped opposite */}
        <div
          className="absolute inset-0 bg-brand-navy/0"
          style={{
            clipPath: `inset(0 ${(1 - comparePosition) * 100}% 0 0)`,
          }}
          aria-hidden
        />

        <div
          className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-surface/95 px-2 py-1 text-[12px] font-medium text-brand-navy shadow-panel"
          style={{ opacity: comparePosition > 0.05 ? 1 : 0.3 }}
        >
          <GitCompareArrows className="h-3.5 w-3.5" aria-hidden />
          {beforeLabel}
        </div>
        <div
          className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-surface/95 px-2 py-1 text-[12px] font-medium text-state-gov-red shadow-panel"
          style={{ opacity: comparePosition < 0.95 ? 1 : 0.3 }}
        >
          <GitCompareArrows className="h-3.5 w-3.5" aria-hidden />
          {afterLabel}
        </div>
      </div>

      {/* Vertical compare divider */}
      <div
        role="presentation"
        className="pointer-events-none absolute inset-y-0 z-20 w-px bg-state-gov-red/80"
        style={{ left: `${comparePosition * 100}%` }}
      />

      {/* Drag handle */}
      <button
        type="button"
        role="slider"
        aria-label="Karşılaştırma sürgüsü"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(comparePosition * 100)}
        aria-valuetext={`${Math.round(comparePosition * 100)}%`}
        onPointerDown={(event) => {
          setDragging(true);
          (event.currentTarget as HTMLButtonElement).setPointerCapture(event.pointerId);
        }}
        onPointerUp={(event) => {
          setDragging(false);
          try {
            (event.currentTarget as HTMLButtonElement).releasePointerCapture(event.pointerId);
          } catch {
            // ignore
          }
        }}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 0.1 : 0.02;
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            setComparePosition(clamp(comparePosition - step, 0, 1));
            trackEvent('timemachine_compare_moved', {
              position: clamp(comparePosition - step, 0, 1),
            });
          }
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            setComparePosition(clamp(comparePosition + step, 0, 1));
            trackEvent('timemachine_compare_moved', {
              position: clamp(comparePosition + step, 0, 1),
            });
          }
          if (event.key === 'Home') {
            event.preventDefault();
            setComparePosition(0);
          }
          if (event.key === 'End') {
            event.preventDefault();
            setComparePosition(1);
          }
        }}
        className={cn(
          'absolute top-1/2 z-30 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-state-gov-red bg-bg-surface shadow-panel',
          'focus-visible:shadow-focus focus-visible:outline-none',
          dragging && 'ring-2 ring-state-gov-red/40',
        )}
        style={{ left: `${comparePosition * 100}%` }}
      >
        <GitCompareArrows className="h-4 w-4 text-state-gov-red" aria-hidden />
      </button>

      {/* Snapshot geometry not available banner — render only when no
          snapshot has been chosen yet. */}
      {!fromAt || !toAt ? (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 z-30 flex justify-center">
          <div className="pointer-events-auto max-w-xl">
            <StatusBanner
              status="not_ready"
              title="Snapshot geometrisi backend tarafından sağlanmıyor"
              message="Karşılaştırma görseli, plan değişiklik geometrisi ingestion modülü tamamlandığında açılacak. Şu anda yalnızca metinsel diff (sağdaki panel) çalışmaktadır."
            />
          </div>
        </div>
      ) : null}

      {tileError ? (
        <div className="absolute inset-x-4 bottom-16 z-30 mx-auto max-w-xl">
          <StatusBanner
            status="unavailable"
            title="Tile yüklenemedi"
            message={tileError}
            onRetry={() => {
              setTileError(null);
              mapRef.current?.triggerRepaint();
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

const NoSSRMap = dynamic(() => Promise.resolve(MapInner), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center bg-bg-subtle">
      <Skeleton className="h-32 w-32" rounded="lg" />
    </div>
  ),
});

export function LayerDiffOverlay(props: LayerDiffOverlayProps) {
  return <NoSSRMap {...props} />;
}
