"use client";

export function SkipToMain() {
  return (
    <a
      href="#main-map-workspace"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:inline-flex focus:h-11 focus:items-center focus:rounded-full focus:border focus:border-brand-green/40 focus:bg-surface-2 focus:px-4 focus:text-sm focus:font-semibold focus:text-fg-primary focus:shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
    >
      Harita çalışma alanına atla
    </a>
  );
}
