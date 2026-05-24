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
      <span className="grid h-9 w-9 place-items-center rounded-2xl border border-white/18 bg-white/12 shadow-[inset_0_1px_0_rgb(255_255_255/0.24)]">
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
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M2 12 H22"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeOpacity="0.65"
        />
        <path
          d="M12 2 V22"
          stroke="currentColor"
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
          stroke="rgb(var(--accent-navy))"
          strokeWidth="1"
          fill="none"
        />
        </svg>
      </span>
      {showLabel && (
        <span className="flex flex-col leading-[0.95]">
          <span className="text-[15px] font-black tracking-[-0.035em] text-current">
            E-İmar
          </span>
          <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-current/60">
            Parsel · Plan · GIS
          </span>
        </span>
      )}
    </span>
  );
}
