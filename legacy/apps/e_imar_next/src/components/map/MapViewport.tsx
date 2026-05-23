'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapStore } from '@/lib/store/map-store';
import { resolveMapStyle } from '@/lib/map/styles';
import { Skeleton } from '@/components/data/Skeleton';
import { StatusBanner } from '@/components/data/StatusBanner';
import { ReadinessGate } from '@/components/data/ReadinessGate';
import { GISLegend } from './GISLegend';
import { MapControls } from './MapControls';
import { useBootstrap } from '@/lib/query/hooks';
import { cn } from '@/lib/utils/cn';
import type { Map as MapLibreMap, StyleSpecification } from 'maplibre-gl';

interface MapViewportProps {
  className?: string;
}

/**
 * Inner client component that actually instantiates the MapLibre map. We
 * dynamic-import this to avoid SSR pitfalls (window/document references).
 */
function MapViewportInner({ className }: MapViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const [tileError, setTileError] = useState<string | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number; lon: number; lat: number } | null>(null);
  const reduce = useReducedMotion();

  const center = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);
  const bearing = useMapStore((s) => s.bearing);
  const pitch = useMapStore((s) => s.pitch);
  const mapStyle = useMapStore((s) => s.mapStyle);
  const setView = useMapStore((s) => s.setView);
  const layers = useMapStore((s) => s.layers);

  const bootstrap = useBootstrap();
  const tileStatus = bootstrap.data?.map?.tileStatus;

  // Initialise map once on mount.
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
      map.on('error', (e) => {
        if (e?.error && 'message' in e.error) {
          setTileError((e.error as Error).message);
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
      map.on('mousemove', (event) => {
        setHover({
          x: event.point.x,
          y: event.point.y,
          lon: event.lngLat.lng,
          lat: event.lngLat.lat,
        });
      });
      map.on('mouseleave', () => setHover(null));
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // We deliberately only run this once. Subsequent style/view changes are
    // handled by separate effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply external style changes from the store (without re-creating map).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const style = resolveMapStyle(mapStyle);
    setStyleLoaded(false);
    map.setStyle(style as string | StyleSpecification);
    map.once('load', () => setStyleLoaded(true));
  }, [mapStyle]);

  // Apply layer visibility + opacity from store. In Sprint 1 we don't add
  // overlays yet; this loop is a no-op until layer sources are wired in
  // Sprint 2. We still iterate so the effect dependency is real and the
  // store stays the source of truth.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoaded) return;
    layers.forEach((layer) => {
      const sourceLayerId = `overlay-${layer.id}`;
      if (map.getLayer(sourceLayerId)) {
        map.setLayoutProperty(sourceLayerId, 'visibility', layer.enabled ? 'visible' : 'none');
        const paintProp = (map.getLayer(sourceLayerId) as { type?: string } | undefined)?.type;
        if (paintProp === 'fill') {
          map.setPaintProperty(sourceLayerId, 'fill-opacity', layer.opacity);
        } else if (paintProp === 'line') {
          map.setPaintProperty(sourceLayerId, 'line-opacity', layer.opacity);
        } else if (paintProp === 'raster') {
          map.setPaintProperty(sourceLayerId, 'raster-opacity', layer.opacity);
        }
      }
    });
  }, [layers, styleLoaded]);

  const tileGateStatus = tileStatus?.status;
  return (
    <div className={cn('relative h-full w-full overflow-hidden bg-bg-subtle', className)}>
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

      {hover && styleLoaded ? (
        <div
          className="pointer-events-none absolute z-30 rounded-md border border-border-subtle bg-bg-surface/95 px-2 py-1 font-data text-[11px] tabular-nums text-text-secondary shadow-panel"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
        >
          {hover.lat.toFixed(5)}°, {hover.lon.toFixed(5)}°
        </div>
      ) : null}

      <MapControls />

      <GISLegend />

      {tileGateStatus && tileGateStatus !== 'ok' ? (
        <div className="pointer-events-none absolute inset-x-4 top-4 z-30 flex justify-center">
          <div className="pointer-events-auto max-w-xl">
            <ReadinessGate
              status={tileGateStatus}
              nextActions={tileStatus?.nextActions}
              endpoint="/website/bootstrap.map.tileStatus"
              onRetry={() => bootstrap.refetch()}
              notReadyTitle="Harita kaynağı hazır değil"
              notReadyDescription={
                typeof tileStatus?.message === 'string' ? tileStatus.message : undefined
              }
            >
              <div />
            </ReadinessGate>
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

const NoSSRMapViewport = dynamic(() => Promise.resolve(MapViewportInner), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center bg-bg-subtle">
      <Skeleton className="h-32 w-32" rounded="lg" />
    </div>
  ),
});

export function MapViewport(props: MapViewportProps) {
  return <NoSSRMapViewport {...props} />;
}
