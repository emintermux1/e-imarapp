import { PlatformShell } from "@/components/shell/PlatformShell";

export default function TimeMachinePage() {
  return (
    <PlatformShell>
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-semibold">Time Machine</h1>
        <p className="mt-2 text-sm text-slate-600">
          Geçmiş plan değişimleri ve uydu katmanları için zaman ekseni slider arayüzü.
        </p>
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <label className="text-xs text-slate-500">Zaman Ekseni</label>
          <input className="mt-2 w-full" type="range" min={2015} max={2026} defaultValue={2024} />
        </div>
      </section>
    </PlatformShell>
  );
}
