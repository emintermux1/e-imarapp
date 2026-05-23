import { PlatformShell } from "@/components/shell/PlatformShell";

export default function WatchlistPage() {
  return (
    <PlatformShell>
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h1 className="text-xl font-semibold">Parsel Alarm Paneli</h1>
        <p className="mt-2 text-sm text-slate-600">
          Alarm kurulan parseller, bölgeler ve belediye kararları bu ekranda listelenir.
        </p>
      </section>
    </PlatformShell>
  );
}
