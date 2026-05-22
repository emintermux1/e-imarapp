import { PropsWithChildren } from "react";
import clsx from "clsx";

export function DataCard({
  title,
  children,
  className,
}: PropsWithChildren<{ title: string; className?: string }>) {
  return (
    <article
      className={clsx(
        "rounded-xl border border-slate-200 bg-white p-4 shadow-sm",
        className
      )}
    >
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-2 text-sm text-slate-600">{children}</div>
    </article>
  );
}

export function ZoningBadge({
  label,
  tone = "blue",
}: {
  label: string;
  tone?: "blue" | "red" | "green" | "amber";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-800 border-blue-200",
    red: "bg-red-50 text-red-800 border-red-200",
    green: "bg-emerald-50 text-emerald-800 border-emerald-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
  };
  return (
    <span
      className={clsx(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
        tones[tone]
      )}
    >
      {label}
    </span>
  );
}

export function RiskIndicator({ score }: { score?: number }) {
  const value = score ?? 0;
  const tone = value > 70 ? "red" : value > 40 ? "amber" : "green";
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">Risk Skoru</span>
        <ZoningBadge label={String(value)} tone={tone} />
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div
          className={clsx(
            "h-2 rounded-full transition-all",
            tone === "red"
              ? "bg-red-500"
              : tone === "amber"
              ? "bg-amber-500"
              : "bg-emerald-500"
          )}
          style={{ width: `${Math.max(6, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

export function LayerToggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

export function GISLegend() {
  const entries = [
    ["Parsel Sınırı", "bg-red-500"],
    ["İmar Planı", "bg-blue-500"],
    ["Risk Katmanı", "bg-amber-500"],
    ["Yeşil Alan", "bg-emerald-500"],
  ];
  return (
    <div className="flex flex-wrap gap-3 rounded-lg bg-white/90 p-2 text-xs shadow">
      {entries.map(([label, className]) => (
        <span key={label} className="inline-flex items-center gap-1.5 text-slate-700">
          <i className={clsx("inline-block h-2.5 w-2.5 rounded", className)} />
          {label}
        </span>
      ))}
    </div>
  );
}
