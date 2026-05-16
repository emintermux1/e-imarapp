import Link from "next/link";

type BrandMarkProps = {
  href?: string;
  compact?: boolean;
  inverted?: boolean;
  className?: string;
  tagline?: string;
};

export function BrandMark({ href = "/", compact = false, inverted = false, className = "", tagline = "imar haritası" }: BrandMarkProps) {
  const content = (
    <span className={`inline-flex items-center gap-3 ${className}`} aria-label="e imar">
      <BrandSymbol className={compact ? "h-9 w-9" : "h-11 w-11"} inverted={inverted} />
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span className={`text-[1.18rem] font-black tracking-[-0.075em] ${inverted ? "text-[#fffaf0]" : "text-[#17231f]"}`}>
            e<span className="text-[#087d7f]">imar</span>
          </span>
          <span className={`mt-1 text-[0.56rem] font-extrabold uppercase tracking-[0.24em] ${inverted ? "text-[#c6d4cb]" : "text-[#65726b]"}`}>
            {tagline}
          </span>
        </span>
      ) : null}
    </span>
  );

  return href ? (
    <Link href={href} className="inline-flex rounded-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]">
      {content}
    </Link>
  ) : (
    content
  );
}

export function BrandSymbol({ className = "h-11 w-11", inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={`relative inline-grid shrink-0 place-items-center rounded-[1.15rem] ${inverted ? "bg-[#fffaf0]" : "bg-[#17231f]"} shadow-[0_18px_38px_rgba(23,35,31,0.22)] ${className}`}>
      <span className="absolute inset-[3px] rounded-[0.94rem] border border-white/18" />
      <svg viewBox="0 0 48 48" className="h-[76%] w-[76%]" role="img" aria-hidden="true">
        <path d="M9.8 31.2 22.3 9.9c.8-1.3 2.6-1.3 3.4 0l12.5 21.3c.8 1.3-.2 2.9-1.7 2.9H11.5c-1.5 0-2.4-1.6-1.7-2.9Z" fill="#087d7f" />
        <path d="M15.3 30.2 24 15.2l8.8 15H15.3Z" fill="#fffaf0" opacity=".92" />
        <path d="M11 35.8h26" stroke={inverted ? "#17231f" : "#fffaf0"} strokeWidth="3.4" strokeLinecap="round" />
        <path d="M17.5 40.1h13" stroke="#d9a441" strokeWidth="3.4" strokeLinecap="round" />
        <circle cx="24" cy="24" r="4.5" fill={inverted ? "#17231f" : "#fffaf0"} opacity=".18" />
      </svg>
    </span>
  );
}
