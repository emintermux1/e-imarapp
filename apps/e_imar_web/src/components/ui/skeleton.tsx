"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useDelayedDisplay } from "@/hooks/use-delayed-display";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** When false, render nothing (children, if any). */
  loading?: boolean;
  /** Delay in ms before showing skeleton. Default 200. */
  delayMs?: number;
}

/**
 * Loading placeholder shaped like a single card row. Honors `prefers-reduced-motion`
 * via the shimmer animation defined in tokens (it's CSS-only, the underlying
 * animation respects `MotionConfig`).
 *
 * Pass `loading={true}` to gate by delay; or omit it and render unconditionally.
 */
export function Skeleton({
  className,
  loading,
  delayMs = 200,
  children,
  ...props
}: SkeletonProps) {
  const showDelayed = useDelayedDisplay({ enabled: loading ?? true, delayMs });
  const visible = loading == null ? true : showDelayed;
  if (loading != null && !visible) return <>{children}</>;
  return (
    <div
      className={cn(
        "shimmer-overlay rounded-sm bg-surface-1 border border-border-subtle/60",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * Composed skeletons that mirror common section shapes.
 */
export function SkeletonRow({
  width = "w-full",
  height = "h-3"
}: {
  width?: string;
  height?: string;
}) {
  return <Skeleton className={cn(height, width)} />;
}

export function SkeletonDataCard() {
  return (
    <div className="rounded-md border border-border-subtle bg-surface-2 p-3 flex flex-col gap-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-2.5 w-32" />
      <div className="grid grid-cols-2 gap-1.5 mt-2">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    </div>
  );
}

export function SkeletonRiskGrid() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-md border border-border-subtle bg-surface-2 px-2.5 py-2 flex flex-col gap-1"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-4 w-9 rounded-sm" />
          </div>
          <div className="flex items-center gap-0.5 mt-1">
            <Skeleton className="h-1.5 flex-1" />
            <Skeleton className="h-1.5 flex-1" />
            <Skeleton className="h-1.5 flex-1" />
            <Skeleton className="h-1.5 flex-1" />
            <Skeleton className="h-1.5 flex-1" />
          </div>
          <Skeleton className="h-2.5 w-16 mt-0.5" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTimelineRow() {
  return (
    <div className="flex flex-col gap-2 p-3 rounded-md border border-border-subtle bg-surface-2">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-5 w-12 rounded-sm" />
      </div>
      <Skeleton className="h-3 w-40" />
      <Skeleton className="h-2.5 w-full" />
      <div className="grid grid-cols-3 gap-1.5 mt-1">
        <Skeleton className="h-9" />
        <Skeleton className="h-9" />
        <Skeleton className="h-9" />
      </div>
    </div>
  );
}

/**
 * Shows `children` immediately; on the first render with `loading=true`, the
 * skeleton replaces the children only after `delayMs`. As soon as
 * `loading=false`, children re-appear instantly.
 */
export function SkeletonGate({
  loading,
  delayMs = 200,
  fallback,
  children
}: {
  loading: boolean;
  delayMs?: number;
  fallback: React.ReactNode;
  children: React.ReactNode;
}) {
  const show = useDelayedDisplay({ enabled: loading, delayMs });
  if (loading && show) return <>{fallback}</>;
  return <>{children}</>;
}
