import { HomeActionPanel } from "@/components/home/HomeActionPanel";
import { SourceReadinessStrip } from "@/components/home/SourceReadinessStrip";
import { getWebsiteLiveReadiness } from "@/lib/api";
import { normalizeReadinessSources } from "@/lib/source-status";

export default async function HomePage() {
  let readiness: Awaited<ReturnType<typeof getWebsiteLiveReadiness>> | null = null;

  try {
    readiness = await getWebsiteLiveReadiness();
  } catch {
    readiness = null;
  }

  const sources = normalizeReadinessSources(readiness);

  return (
    <div className="relative -mx-6 -my-6 min-h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.16),transparent_32%),linear-gradient(135deg,#020617_0%,#0f172a_48%,#111827_100%)] px-4 py-5 md:-mx-8 md:-my-8 md:px-8 md:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px] opacity-35" />
      <div className="relative mx-auto max-w-7xl space-y-8 md:space-y-10">
        <section className="grid gap-7 pt-6 md:pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div className="animate-fade-in-up">
            <p className="mb-5 inline-flex rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-cyan-100">
              Canlı kaynak kontrollü e-İmar
            </p>
            <h1 className="max-w-4xl text-4xl font-extrabold tracking-[-0.04em] text-white md:text-6xl">
              Parsel sonucunu değil, kaynağın ne dediğini göster.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
              Ada/parsel sorgula, belediye kaynağını kontrol et, sonuç varsa kanıtıyla gör. Sonuç yoksa neden yok, hangi kaynak denendi ve sıradaki doğrulama adımı açıkça kalır.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Resmî belge değildir</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Demo veri resmî etiketlenmez</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Kaynak ve tarih her raporda</span>
            </div>
          </div>

          <div className="animate-fade-in-up animate-delay-1">
            <SourceReadinessStrip sources={sources} generatedAt={readiness?.generatedAt} />
          </div>
        </section>

        <HomeActionPanel />

        <section className="grid gap-4 pb-8 md:grid-cols-[0.7fr_1.3fr]">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Mobil akış</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Tek elle sorgu, sonra harita.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            {["Ara", "Kaynak kontrolü", "Sonuç", "Rapor"].map((step, index) => (
              <div key={step} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                <p className="font-mono text-xs text-cyan-100">0{index + 1}</p>
                <p className="mt-3 text-sm font-semibold text-white">{step}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
