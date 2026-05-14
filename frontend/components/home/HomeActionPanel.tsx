import Link from "next/link";
import { ArrowRight, Building2, FileText, MapPinned, Search } from "lucide-react";

const actions = [
  {
    href: "/parsel",
    title: "Ada/parsel sorgula",
    description: "İl, ilçe, ada ve parsel ile canlı kaynak kontrolünü başlat.",
    cta: "Sorguya başla",
    icon: Search,
    featured: true
  },
  {
    href: "/map",
    title: "İl/belediye haritası",
    description: "Belediye kaynağı ve katman hazır mı, harita üstünden gör.",
    cta: "Haritayı aç",
    icon: MapPinned
  },
  {
    href: "/reports",
    title: "Örnek rapor gör",
    description: "Kaynak, tarih, uyarı ve paylaşılabilir çıktı formatını incele.",
    cta: "Raporu incele",
    icon: FileText
  }
];

export function HomeActionPanel() {
  return (
    <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <Link
        href={actions[0].href}
        className="group relative overflow-hidden rounded-[2rem] border border-cyan-200/20 bg-cyan-200 p-5 text-slate-950 shadow-[0_24px_90px_rgba(34,211,238,0.18)] transition-transform duration-300 active:translate-y-0.5 md:p-7"
      >
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/35 blur-2xl transition-transform duration-500 group-hover:scale-125" />
        <Search className="h-8 w-8" />
        <h2 className="mt-10 max-w-lg text-3xl font-bold tracking-tight md:text-4xl">{actions[0].title}</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-800 md:text-base">{actions[0].description}</p>
        <span className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white">
          {actions[0].cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </Link>

      <div className="grid gap-4">
        {actions.slice(1).map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 transition-colors hover:border-cyan-200/25 hover:bg-white/[0.07] active:translate-y-0.5 md:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-cyan-100">
                  <Icon className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-cyan-100" />
              </div>
              <h3 className="mt-8 text-2xl font-semibold tracking-tight text-white">{action.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{action.description}</p>
              <p className="mt-5 text-sm font-semibold text-cyan-100">{action.cta}</p>
            </Link>
          );
        })}
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-5 lg:col-span-2">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-cyan-100" />
            <p className="text-sm text-slate-300">Sonuç yoksa bile kaynak, tarih, engel ve sıradaki doğrulama adımı raporlanır.</p>
          </div>
          <Link href="/sources" className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-4 text-sm font-medium text-white hover:bg-white/5">
            Kaynak önizlemeyi aç
          </Link>
        </div>
      </div>
    </section>
  );
}
