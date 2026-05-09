import Link from "next/link";
import { Map, Search, Globe, FileText, BarChart3, Bell, ArrowRight } from "lucide-react";

const features = [
  { href: "/map", icon: Map, title: "Harita", desc: "Parsel ve planları harita üzerinde keşfedin" },
  { href: "/parsel", icon: Search, title: "Parsel Ara", desc: "TKGM verilerinden parsel sorgulama" },
  { href: "/simulation", icon: Globe, title: "3D Simülasyon", desc: "Yapı hacmi, gölge ve uygunluk analizi" },
  { href: "/satellite", icon: Bell, title: "Uydu Analizi", desc: "Değişim tespiti ve kaçak yapı kontrolü" },
  { href: "/reports", icon: FileText, title: "Raporlar", desc: "Profesyonel parsel ve plan raporları" },
  { href: "/analysis", icon: BarChart3, title: "Analiz", desc: "Birleşebilirlik, değer tahmini, lejant" },
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="text-center py-16 md:py-24 animate-fade-in-up">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
          <span className="text-[var(--accent-cyan)]">e</span>Imar<span className="text-[var(--accent-magenta)]">TR</span>
        </h1>
        <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">
          Türkiye&apos;nin ulusal e-İmar platformu. Parsel, imar planı, 3D simülasyon,
          uydu analizi ve profesyonel raporlama — tek bir yerde.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/map"
            className="inline-flex items-center gap-2 bg-[var(--accent-cyan)] text-[var(--bg-primary)] font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            <Map size={18} /> Haritayı Keşfet <ArrowRight size={16} />
          </Link>
          <Link
            href="/parsel"
            className="inline-flex items-center gap-2 border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium px-6 py-3 rounded-xl hover:bg-white/5 transition-colors"
          >
            <Search size={18} /> Parsel Ara
          </Link>
        </div>
      </section>

      <section className="animate-fade-in-up animate-delay-1">
        <h2 className="text-2xl font-bold mb-6 text-center">Özellikler</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Link
                key={f.href}
                href={f.href}
                className="group bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-6 hover:border-[var(--accent-cyan)]/30 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-cyan)] transition-colors">{f.title}</h3>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">{f.desc}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="animate-fade-in-up animate-delay-2 text-center pb-8">
        <p className="text-xs text-[var(--text-secondary)]">
          eImarTR — T.C. Çevre, Şehircilik ve İklim Değişikliği Bakanlığı veri kaynakları ile entegre.
        </p>
      </section>
    </div>
  );
}
