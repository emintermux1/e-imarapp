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
    <div className="relative -mx-4 -my-4 min-h-[100dvh] overflow-hidden bg-[#f6f1e8] px-4 py-5 text-[#24312f] md:-mx-8 md:-my-8 md:px-8 md:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(36,49,47,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(36,49,47,0.045)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="relative mx-auto max-w-7xl space-y-6 md:space-y-8">
        <section className="grid gap-5 rounded-[2rem] border border-[#d8cdb9] bg-[#fffaf0] p-4 shadow-[0_18px_50px_rgba(72,60,44,0.10)] md:p-7 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="animate-fade-in-up">
            <p className="mb-4 inline-flex rounded-full border border-[#b8d8d1] bg-[#e5f4f1] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#167c80]">
              e imar canlı kaynak kontrollü sorgu
            </p>
            <h1 className="max-w-4xl text-4xl font-extrabold tracking-[-0.035em] text-[#24312f] md:text-6xl">
              Parsel bilgisini sade sor, kaynağı açık göster.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#5f6b67] md:text-lg">
              Ada/parsel veya belediye üzerinden ilerle. Sonuç geldiğinde kaynak, tarih ve uyarı görünür; sonuç yoksa hangi resmi akışın hazır olmadığı anlaşılır.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-[#5f6b67]">
              <span className="rounded-full border border-[#d8cdb9] bg-[#f6f1e8] px-3 py-1.5">Resmî belge değildir</span>
              <span className="rounded-full border border-[#d8cdb9] bg-[#f6f1e8] px-3 py-1.5">Uydurma veri yok</span>
              <span className="rounded-full border border-[#d8cdb9] bg-[#f6f1e8] px-3 py-1.5">Kaynak ve tarih görünür</span>
            </div>
          </div>

          <div className="animate-fade-in-up animate-delay-1">
            <SourceReadinessStrip sources={sources} generatedAt={readiness?.generatedAt} />
          </div>
        </section>

        <HomeActionPanel />

        <section className="grid gap-4 pb-8 md:grid-cols-[0.7fr_1.3fr]">
          <div className="rounded-[1.5rem] border border-[#d8cdb9] bg-[#fffaf0] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b837f]">Mobil akış</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#24312f]">Tek elle sorgu, sonra harita.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            {["Ara", "Kaynak kontrolü", "Sonuç", "Rapor"].map((step, index) => (
              <div key={step} className="rounded-2xl border border-[#d8cdb9] bg-[#fffaf0] p-4">
                <p className="font-mono text-xs text-[#167c80]">0{index + 1}</p>
                <p className="mt-3 text-sm font-semibold text-[#24312f]">{step}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
