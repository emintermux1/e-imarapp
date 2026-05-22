'use client';

import { Box, Locate, Mountain, Plus, Satellite, Map as MapIcon, Minus, X } from 'lucide-react';
import { useState } from 'react';
import { IconButton } from '@/components/ui/IconButton';
import { Tooltip } from '@/components/ui/Tooltip';
import { useMapStore } from '@/lib/store/map-store';
import { trackEvent } from '@/lib/analytics/events';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { MapStyleName } from '@/types/map';
import { cn } from '@/lib/utils/cn';

const STYLE_OPTIONS: Array<{ id: MapStyleName; label: string; icon: React.ReactNode }> = [
  { id: 'streets', label: 'Sokak', icon: <MapIcon className="h-4 w-4" aria-hidden /> },
  { id: 'satellite', label: 'Uydu', icon: <Satellite className="h-4 w-4" aria-hidden /> },
  { id: 'terrain', label: 'Topoğrafya', icon: <Mountain className="h-4 w-4" aria-hidden /> },
];

export function MapControls() {
  const setView = useMapStore((s) => s.setView);
  const zoom = useMapStore((s) => s.zoom);
  const center = useMapStore((s) => s.center);
  const mapStyle = useMapStore((s) => s.mapStyle);
  const setMapStyle = useMapStore((s) => s.setMapStyle);
  const is3D = useMapStore((s) => s.is3D);
  const toggle3D = useMapStore((s) => s.toggle3D);

  const [bannerOpen, setBannerOpen] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const reduce = useReducedMotion();

  function geolocate() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setView({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: Math.max(zoom, 14),
        });
        setGeolocating(false);
      },
      () => setGeolocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  function handleStyleChange(style: MapStyleName) {
    setMapStyle(style);
    trackEvent('map_style_changed', { style });
  }

  function handle3D() {
    toggle3D();
    setBannerOpen(true);
  }

  return (
    <>
      <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
        <div className="flex flex-col overflow-hidden rounded-md border border-border-subtle bg-bg-surface/95 shadow-panel backdrop-blur">
          <Tooltip content="Yakınlaştır" side="left">
            <IconButton
              aria-label="Yakınlaştır"
              variant="ghost"
              onClick={() =>
                setView({ zoom: Math.min(zoom + 1, 22) })
              }
            >
              <Plus className="h-4 w-4" aria-hidden />
            </IconButton>
          </Tooltip>
          <div className="border-t border-border-subtle" />
          <Tooltip content="Uzaklaştır" side="left">
            <IconButton
              aria-label="Uzaklaştır"
              variant="ghost"
              onClick={() => setView({ zoom: Math.max(zoom - 1, 0) })}
            >
              <Minus className="h-4 w-4" aria-hidden />
            </IconButton>
          </Tooltip>
        </div>

        <Tooltip content="Konumumu bul" side="left">
          <div>
            <IconButton
              aria-label="Konumumu bul"
              variant="subtle"
              loading={geolocating}
              onClick={geolocate}
            >
              <Locate className="h-4 w-4" aria-hidden />
            </IconButton>
          </div>
        </Tooltip>

        <Tooltip content="3D modu" side="left">
          <div>
            <IconButton
              aria-label="3D modu"
              variant="subtle"
              active={is3D}
              onClick={handle3D}
            >
              <Box className="h-4 w-4" aria-hidden />
            </IconButton>
          </div>
        </Tooltip>

        <div className="flex overflow-hidden rounded-md border border-border-subtle bg-bg-surface/95 shadow-panel backdrop-blur">
          {STYLE_OPTIONS.map((option) => (
            <Tooltip key={option.id} content={option.label} side="left">
              <IconButton
                aria-label={`Harita stili: ${option.label}`}
                variant="ghost"
                active={mapStyle === option.id}
                onClick={() => handleStyleChange(option.id)}
                className={cn(mapStyle === option.id && 'bg-bg-subtle')}
              >
                {option.icon}
              </IconButton>
            </Tooltip>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-md border border-border-subtle bg-bg-surface/90 px-2 py-1 font-data text-[11px] tabular-nums text-text-muted shadow-panel">
        {center[1].toFixed(3)}°, {center[0].toFixed(3)}° · z{Math.round(zoom)}
      </div>

      <AnimatePresence>
        {bannerOpen ? (
          <motion.div
            key="three-d-banner"
            initial={reduce ? false : { y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.18, ease: [0.2, 0, 0, 1] }}
            className="pointer-events-none absolute inset-x-0 top-4 z-30 flex justify-center"
          >
            <div className="pointer-events-auto inline-flex items-center gap-3 rounded-full border border-border-subtle bg-bg-surface/95 px-4 py-2 text-[13px] text-text-secondary shadow-panel backdrop-blur">
              <Box className="h-4 w-4 text-state-info" aria-hidden />
              <span>3D mod Sprint 3&apos;te aktif olacak.</span>
              <button
                type="button"
                onClick={() => setBannerOpen(false)}
                className="text-text-muted hover:text-text-primary"
                aria-label="Bildirimi kapat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
