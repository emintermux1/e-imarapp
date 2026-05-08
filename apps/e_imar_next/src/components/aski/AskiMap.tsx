'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapStore } from '@/lib/store/map-store';
import { useAskiStore } from '@/lib/store/aski-store';
import { resolveMapStyle } from '@/lib/map/styles';
import { Skeleton } from '@/components/data/Skeleton';
import { StatusBanner } from '@/components/data/StatusBanner';
import { cn } from '@/lib/utils/cn';
import { noticeBbox, planTypeLabel } from './aski-utils';
import { trackEvent } from '@/lib/analytics/events';
import type { SuspensionNotice } from '@/lib/api/types';
import type {
  Map as MapLibreMap,
  MapMouseEvent,
  StyleSpecification,
} from 'maplibre-gl';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

interface AskiMapProps {
  notices: SuspensionNotice[];
  className?: string;
}

interface HoverState {
  x: number;
  y: number;
  title: string;
  planType?: string;
}

/**
 * Build a GeoJSON FeatureCollection from the suspension notices that have a
 * usable geometry. Notices without geometry are omitted from the source —
 * the carousel still lists them so the user can still select them.
 */
function noticesToFeatureCollection(notices: SuspensionNotice[]): FeatureCollection {
  const features: Feature[] = [];
  for (const notice of notices) {
    if (!notice.geometry || typeof notice.geometry !== 'object') continue;
    const geometry = notice.geometry as unknown as Geometry;
    if (!geometry || !('type' in geometry)) continue;
    features.push({
      type: 'Feature',
      id: notice.id,
      geometry,
      properties: {
        id: notice.id,
        planTitle: notice.planTitle ?? '',
        planType: notice.planType ?? '',
        municipalityName: notice.municipalityName ?? '',
      },
    });
  }
  return { type: 'FeatureCollection', features };
}

function MapInner({ notices, className }: AskiMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const [tileError, setTileError] = useState<string | null>(null);
  const [hover, setHover] = useState<HoverState | null>(null);
  const reduce = useReducedMotion();

  const center = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);
  const bearing = useMapStore((s) => s.bearing);
  const pitch = useMapStore((s) => s.pitch);
  const mapStyle = useMapStore((s) => s.mapStyle);
  const setView = useMapStore((s) => s.setView);

  const selectedPlanId = useAskiStore((s) => s.selectedPlanId);
  const selectPlan = useAskiStore((s) => s.selectPlan);

  const featureCollection = useMemo(() => noticesToFeatureCollection(notices), [notices]);

  // Initialise map once.
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

  // Apply external style changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const style = resolveMapStyle(mapStyle);
    setStyleLoaded(false);
    map.setStyle(style as string | StyleSpecification);
    map.once('load', () => setStyleLoaded(true));
  }, [mapStyle]);

  // Wire the askı GeoJSON source + fill/line layers + interactions whenever
  // either the style finishes loading or the feature collection updates.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoaded) return;

    const sourceId = 'aski-notices';
    const fillLayerId = 'aski-fill';
    const lineLayerId = 'aski-line';
    const selectedLayerId = 'aski-selected';

    const existing = map.getSource(sourceId) as ReturnType<MapLibreMap['getSource']> & {
      setData?: (data: FeatureCollection) => void;
    };
    if (existing && typeof existing.setData === 'function') {
      existing.setData(featureCollection);
    } else {
      map.addSource(sourceId, {
        type: 'geojson',
        data: featureCollection,
        promoteId: 'id',
      });
    }

    if (!map.getLayer(fillLayerId)) {
      map.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': 'rgba(180, 35, 44, 0.55)',
          'fill-opacity': 0.18,
        },
      });
    }

    if (!map.getLayer(lineLayerId)) {
      map.addLayer({
        id: lineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#B4232C',
          'line-width': 1.5,
          'line-opacity': 0.85,
        },
      });
    }

    if (!map.getLayer(selectedLayerId)) {
      map.addLayer({
        id: selectedLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': 'rgba(180, 35, 44, 0.55)',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            0.45,
            0,
          ],
        },
      });
    }

    function handleClick(event: MapMouseEvent) {
      const features = map?.queryRenderedFeatures(event.point, {
        layers: [fillLayerId],
      });
      if (!features || features.length === 0) return;
      const feature = features[0];
      const id = feature.properties?.id ?? feature.id;
      if (typeof id === 'string' && id) {
        selectPlan(id);
        const planType =
          typeof feature.properties?.planType === 'string'
            ? (feature.properties.planType as string)
            : undefined;
        trackEvent('aski_plan_selected', { planId: id, planType });
      }
    }

    function handleEnter() {
      if (map) map.getCanvas().style.cursor = 'pointer';
    }
    function handleLeave() {
      if (map) map.getCanvas().style.cursor = '';
      setHover(null);
    }
    function handleMove(event: MapMouseEvent) {
      const features = map?.queryRenderedFeatures(event.point, {
        layers: [fillLayerId],
      });
      const feature = features?.[0];
      if (!feature) {
        setHover(null);
        return;
      }
      const title =
        typeof feature.properties?.planTitle === 'string' && feature.properties.planTitle.trim()
          ? (feature.properties.planTitle as string)
          : `Askı kaydı #${feature.properties?.id ?? feature.id ?? ''}`;
      const planType =
        typeof feature.properties?.planType === 'string'
          ? planTypeLabel(feature.properties.planType as string)
          : undefined;
      setHover({
        x: event.point.x,
        y: event.point.y,
        title,
        planType,
      });
    }

    map.on('click', fillLayerId, handleClick);
    map.on('mouseenter', fillLayerId, handleEnter);
    map.on('mouseleave', fillLayerId, handleLeave);
    map.on('mousemove', fillLayerId, handleMove);

    return () => {
      map.off('click', fillLayerId, handleClick);
      map.off('mouseenter', fillLayerId, handleEnter);
      map.off('mouseleave', fillLayerId, handleLeave);
      map.off('mousemove', fillLayerId, handleMove);
    };
  }, [styleLoaded, featureCollection, selectPlan]);

  // Toggle selected feature-state and pan/fit when selection changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoaded) return;

    // Reset prior feature-state.
    notices.forEach((notice) => {
      try {
        map.setFeatureState(
          { source: 'aski-notices', id: notice.id },
          { selected: notice.id === selectedPlanId },
        );
      } catch {
        // Source may not be ready yet — silently ignore.
      }
    });

    if (!selectedPlanId) return;
    const notice = notices.find((n) => n.id === selectedPlanId);
    if (!notice) return;
    const bbox = noticeBbox(notice);
    if (!bbox) return;
    map.fitBounds(
      [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]],
      ],
      { padding: 80, duration: 480, maxZoom: 16 },
    );
  }, [selectedPlanId, notices, styleLoaded]);

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
          className="pointer-events-none absolute z-30 max-w-xs rounded-md border border-border-subtle bg-bg-surface/95 px-2 py-1.5 text-[11px] text-text-secondary shadow-panel"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
        >
          <div className="font-medium text-text-primary">{hover.title}</div>
          {hover.planType ? (
            <div className="mt-0.5 text-[11px] text-state-gov-red">{hover.planType}</div>
          ) : null}
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

export function AskiMap(props: AskiMapProps) {
  return <NoSSRMap {...props} />;
}
