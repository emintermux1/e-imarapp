import Link from "next/link";
import { PlatformShell } from "@/components/shell/PlatformShell";

export default function HomePage() {
  return (
    <PlatformShell>
      <section className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-r from-[#0F2743] to-[#2D5B88] p-6 text-white">
          <p className="text-xs tracking-[0.2em] text-slate-200">RESMİ VERİ + GIS ANALİZ</p>
          <h1 className="mt-2 text-3xl font-semibold">İmar Durumu Sorgula</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-200">
            TKGM, e-Plan ve belediye CBS kaynaklarından gelen verilerle parsel bazlı imar kararını tek panelde inceleyin.
          </p>
          <div className="mt-4 grid gap-2 md:grid-cols-5">
            <input className="rounded-lg border border-white/30 bg-white/95 px-3 py-2 text-sm text-slate-900" placeholder="Şehir" />
            <input className="rounded-lg border border-white/30 bg-white/95 px-3 py-2 text-sm text-slate-900" placeholder="İlçe" />
            <input className="rounded-lg border border-white/30 bg-white/95 px-3 py-2 text-sm text-slate-900" placeholder="Mahalle" />
            <input className="rounded-lg border border-white/30 bg-white/95 px-3 py-2 text-sm text-slate-900" placeholder="Ada / Parsel" />
            <Link href="/parcel/demo" className="rounded-lg bg-emerald-500 px-3 py-2 text-center text-sm font-semibold">
              MAP WORKSPACE
            </Link>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <InfoCard title="Resmi Bilgiler" text="Parsel, plan ve katman verileri resmi kaynak bazlı provenance ile sunulur." />
          <InfoCard title="Detaylı Analiz" text="TAKS/KAKS, gabari, risk ve plan notu açıklamaları tek akışta." />
          <InfoCard title="Yatırım Potansiyeli" text="Bu arsaya ne yapılabilir? metriklerini hızlı karar panelinde gösterir." />
        </div>
      </section>
    </PlatformShell>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{text}</p>
    </article>
  );
}
