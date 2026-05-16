import { BrandMark, BrandSymbol } from "@/components/BrandMark";

const colors = [
  ["Tapu Mürekkebi", "#17231f", "Kurumsal güven, veri ve rapor zemini"],
  ["Harita Kremi", "#fffaf0", "Vatandaş arayüzü ve okunaklı paneller"],
  ["Kadastro Teal", "#087d7f", "Ana aksiyon, konum ve harita odağı"],
  ["Plan Altını", "#d9a441", "Resmi belge, plan notu ve vurgu"],
  ["Uyarı Kili", "#c5463c", "Risk, uyarı ve kritik durum"],
  ["Pafta Yeşili", "#d8e0d2", "Harita dokusu ve sakin arka plan"]
];

const principles = [
  ["Resmi", "Tapu/belediye güveni; veri iddiası abartılmaz."],
  ["Premium", "Sade harita yüzeyi, yüksek boşluk, net tipografi."],
  ["Erişilebilir", "Vatandaşın anlayacağı kısa etiketler ve açık kontrast."]
];

export default function BrandPage() {
  return (
    <main className="min-h-[100dvh] bg-[#f6f1e6] px-4 py-10 text-[#17231f] md:px-10 md:py-16">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2.6rem] border border-[#d7d0bc]/85 bg-[#fffaf0] p-2 shadow-[0_30px_90px_rgba(37,48,42,0.12)]">
          <div className="overflow-hidden rounded-[2.15rem] border border-[#d7d0bc]/70 bg-[radial-gradient(circle_at_82%_12%,rgba(8,125,127,0.16),transparent_30%),linear-gradient(135deg,#fffaf0,#f6f1e6)] p-6 md:p-10">
            <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr]">
              <div>
                <p className="inline-flex rounded-full border border-[#d7d0bc] bg-white/55 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#087d7f]">Marka sistemi</p>
                <h1 className="mt-5 text-5xl font-black leading-[0.9] tracking-[-0.08em] md:text-7xl">Resmi güven, modern harita, kolay kullanım.</h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-[#65726b]">eimar kimliği A/B/C ortasıdır: belediye/tapu güvenini, premium harita ürünlerinin sakinliğini ve vatandaşın hızlı anlayacağı dili aynı sistemde toplar.</p>
                <div className="mt-7 grid gap-2 sm:grid-cols-3">
                  {principles.map(([title, text]) => (
                    <div key={title} className="rounded-[1.35rem] border border-[#d7d0bc]/85 bg-white/52 p-3">
                      <p className="text-sm font-black tracking-[-0.04em]">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-[#65726b]">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[2rem] bg-[#17231f] p-6 text-[#fffaf0] shadow-[0_24px_60px_rgba(23,35,31,0.22)]">
                  <BrandMark inverted tagline="resmi veri" />
                  <p className="mt-12 text-sm leading-6 text-[#c6d4cb]">Koyu zemin: yönetim paneli, sidebar, rapor ve veri yoğun ekranlar.</p>
                </div>
                <div className="rounded-[2rem] border border-[#d7d0bc] bg-[#f6f1e6] p-6">
                  <BrandMark tagline="imar haritası" />
                  <p className="mt-12 text-sm leading-6 text-[#65726b]">Açık zemin: parsel arama, mobil ürün ve vatandaş odaklı akışlar.</p>
                </div>
                <div className="rounded-[2rem] border border-[#d7d0bc] bg-white p-6 sm:col-span-2">
                  <div className="flex flex-wrap items-center gap-6">
                    <BrandSymbol className="h-24 w-24" />
                    <BrandSymbol className="h-16 w-16" />
                    <BrandSymbol className="h-11 w-11" />
                    <BrandSymbol className="h-9 w-9" inverted />
                    <div className="min-w-[220px] flex-1">
                      <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-[#087d7f]">Sembol mantığı</p>
                      <p className="mt-2 text-sm leading-6 text-[#65726b]">Üçgen pafta/konum formu, yatay kadastro çizgisi ve altın plan katmanı. Harita ürünü gibi modern, resmi evrak gibi güvenilir.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-6">
          {colors.map(([name, value, note]) => (
            <div key={name} className="rounded-[1.5rem] border border-[#d7d0bc]/85 bg-[#fffaf0] p-3 shadow-[0_14px_36px_rgba(37,48,42,0.08)]">
              <div className="h-20 rounded-[1.1rem]" style={{ backgroundColor: value }} />
              <p className="mt-3 text-xs font-extrabold text-[#17231f]">{name}</p>
              <p className="mt-1 font-mono text-[11px] text-[#65726b]">{value}</p>
              <p className="mt-2 text-[11px] leading-4 text-[#65726b]">{note}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
