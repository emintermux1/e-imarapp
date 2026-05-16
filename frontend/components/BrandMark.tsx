import Link from "next/link";

type BrandMarkProps = {
  href?: string;
  compact?: boolean;
  inverted?: boolean;
  className?: string;
  tagline?: string;
};

export function BrandMark({ href = "/", compact = false, inverted = false, className = "", tagline = "parsel atlası" }: BrandMarkProps) {
  const content = (
    <span className={`inline-flex items-center gap-3 ${className}`} aria-label="e imar">
      <BrandSymbol className={compact ? "h-9 w-9" : "h-11 w-11"} inverted={inverted} />
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span className={`text-[1.24rem] font-black tracking-[-0.095em] ${inverted ? "text-[#fffaf0]" : "text-[#17231f]"}`}>
            e<span className="text-[#0b8f8f]">imar</span>
          </span>
          <span className={`mt-1 text-[0.55rem] font-extrabold uppercase tracking-[0.28em] ${inverted ? "text-[#cbd8d1]" : "text-[#64736b]"}`}>
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
  const shell = inverted ? "bg-[#fffaf0]" : "bg-[#14211d]";
  const paper = inverted ? "#14211d" : "#fffaf0";
  const grid = inverted ? "#fffaf0" : "#14211d";

  return (
    <span className={`relative inline-grid shrink-0 place-items-center rounded-[1.05rem] ${shell} shadow-[0_18px_42px_rgba(20,33,29,0.22)] ring-1 ring-black/5 ${className}`}>
      <span className="absolute inset-[3px] rounded-[0.86rem] border border-white/15" />
      <svg viewBox="0 0 64 64" className="h-[78%] w-[78%]" role="img" aria-hidden="true">
        <path d="M18.8 12.5h23.7c4.5 0 8.1 3.6 8.1 8.1v22.8c0 4.5-3.6 8.1-8.1 8.1H21.6c-4.5 0-8.1-3.6-8.1-8.1V17.8c0-2.9 2.4-5.3 5.3-5.3Z" fill={paper} />
        <path d="M19.3 21.2h25.4M19.3 32h25.4M19.3 42.8h25.4M27.2 16.8v29.7M37.2 16.8v29.7" stroke={grid} strokeOpacity=".12" strokeWidth="1.8" />
        <path d="M20.4 38.2c4.8-11.7 15.5-16.8 24.6-10.7" fill="none" stroke="#0b8f8f" strokeWidth="6" strokeLinecap="round" />
        <path d="M20.2 44.7h21.2" stroke="#d6a23b" strokeWidth="4.8" strokeLinecap="round" />
        <circle cx="45" cy="27.5" r="4.6" fill="#c5463c" />
        <circle cx="45" cy="27.5" r="2" fill="#fffaf0" />
      </svg>
    </span>
  );
}
