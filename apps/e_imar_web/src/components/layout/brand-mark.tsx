import * as React from "react";

interface BrandMarkProps {
  className?: string;
  showLabel?: boolean;
}

export function BrandMark({ className, showLabel = true }: BrandMarkProps) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 ${className ?? ""}`}
      aria-label="E-İmar"
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg border border-brand-navy/20 bg-[rgb(var(--accent-navy)/0.07)] shadow-[inset_0_1px_0_rgb(255_255_255/0.7)]">
        <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <rect
          x="2"
          y="2"
          width="20"
          height="20"
          rx="3"
          stroke="rgb(var(--accent-navy))"
          strokeWidth="1.5"
        />
        <path
          d="M2 12 H22"
          stroke="rgb(var(--accent-navy))"
          strokeWidth="1.5"
          strokeOpacity="0.65"
        />
        <path
          d="M12 2 V22"
          stroke="rgb(var(--accent-navy))"
          strokeWidth="1.5"
          strokeOpacity="0.65"
        />
        <rect x="3.4" y="3.4" width="3.6" height="3.6" rx="0.6" fill="rgb(var(--z-konut))" />
        <rect x="13" y="3.4" width="7.6" height="3.6" rx="0.6" fill="rgb(var(--z-kamu))" />
        <rect x="3.4" y="13" width="7.6" height="3.6" rx="0.6" fill="rgb(var(--z-yesil))" />
        <rect x="13" y="13" width="7.6" height="7.6" rx="0.6" fill="rgb(var(--z-ticaret))" />
        <rect
          x="13"
          y="13"
          width="7.6"
          height="7.6"
          rx="0.6"
          stroke="rgb(var(--accent-red))"
          strokeWidth="1"
          fill="none"
        />
        </svg>
      </span>
      {showLabel && (
        <span className="flex flex-col leading-[0.95]">
          <span className="text-[14px] font-semibold tracking-[-0.025em] text-fg-primary">
            E-İmar
          </span>
          <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.18em] text-fg-muted">
            Parsel · Plan · GIS
          </span>
        </span>
      )}
    </span>
  );
}
