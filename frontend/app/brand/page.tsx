import { BrandMark, BrandSymbol } from "@/components/BrandMark";

const colors = [
  ["Ink", "#14211d"],
  ["Paper", "#fffaf0"],
  ["Cadastre", "#0b8f8f"],
  ["Permit", "#d6a23b"],
  ["Signal", "#c5463c"],
  ["Map", "#d8e0d2"]
];

const rules = [
  ["Resmi", "Veri iddiası sakin; belediye/tapu güveni var."],
  ["Premium", "Az renk, güçlü boşluk, net monogram."],
  ["Kolay", "Vatandaşın anlayacağı kısa ürün dili."]
];

export default function BrandPage() {
  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#0f1714] px-4 py-5 text-[#14211d] md:px-8 md:py-8">
      <section className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative overflow-hidden rounded-[2.8rem] bg-[#fffaf0] p-7 shadow-[0_42px_140px_rgba(0,0,0,0.36)] ring-1 ring-white/10 md:p-12 lg:min-h-[calc(100dvh-4rem)]">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#0b8f8f]/14 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[58%] w-[58%] rounded-tl-[8rem] bg-[#d8e0d2]/50" />
          <div className="relative">
            <BrandMark tagline="parsel atlası" />
            <p className="mt-16 inline-flex rounded-full border border-[#d7d0bc] bg-white/60 px-3 py-1 text-[10px] font-black uppercase tracking-[0.26em] text-[#0b8f8f]">kimlik yönü</p>
            <h1 className="mt-6 max-w-3xl text-[4.6rem] font-black leading-[0.8] tracking-[-0.1em] md:text-[7.4rem]">
              İmar için sakin otorite.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-[#59675f]">
              Ne devlet sitesi kadar soğuk, ne SaaS kadar jenerik. eimar; parsel, plan ve rapor işini tek bakışta güven veren bir atlas markasına çevirir.
            </p>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {rules.map(([title, copy]) => (
                <div key={title} className="rounded-[1.6rem] border border-[#d7d0bc]/85 bg-white/55 p-4 shadow-[0_18px_42px_rgba(37,48,42,0.07)]">
                  <p className="text-lg font-black tracking-[-0.06em]">{title}</p>
                  <p className="mt-2 text-xs leading-5 text-[#65726b]">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[2.4rem] bg-[#14211d] p-7 text-[#fffaf0] shadow-[0_32px_90px_rgba(0,0,0,0.3)]">
              <BrandMark inverted tagline="resmi atlas" />
              <p className="mt-24 max-w-xs text-sm leading-6 text-[#cbd8d1]">Kurum ve dashboard yüzeyi: koyu, kontrollü, veri ağırlıklı.</p>
            </div>
            <div className="rounded-[2.4rem] border border-[#d7d0bc] bg-[#fffaf0] p-7 shadow-[0_32px_90px_rgba(37,48,42,0.14)]">
              <BrandMark tagline="parsel atlası" />
              <p className="mt-24 max-w-xs text-sm leading-6 text-[#65726b]">Vatandaş yüzeyi: açık, okunaklı, harita odaklı.</p>
            </div>
          </div>

          <div className="rounded-[2.4rem] border border-[#d7d0bc] bg-[#fffaf0] p-7 shadow-[0_32px_90px_rgba(37,48,42,0.14)]">
            <div className="flex flex-wrap items-end gap-6">
              <BrandSymbol className="h-36 w-36" />
              <BrandSymbol className="h-24 w-24" inverted />
              <BrandSymbol className="h-16 w-16" />
              <BrandSymbol className="h-10 w-10" inverted />
              <div className="min-w-[260px] flex-1 pb-2">
                <p className="text-xs font-black uppercase tracking-[0.26em] text-[#0b8f8f]">logo fikri</p>
                <h2 className="mt-2 max-w-sm text-3xl font-black leading-[0.92] tracking-[-0.075em] md:text-[2.65rem]">Pafta içinde rota.</h2>
                <p className="mt-3 text-sm leading-6 text-[#65726b]">Dış form parsel paftası; teal rota sorgu akışını; altın çizgi imar planını; kırmızı nokta resmi uyarı/ruhsat izini anlatır.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {colors.map(([name, value]) => (
              <div key={name} className="rounded-[1.45rem] border border-white/10 bg-[#fffaf0] p-3 shadow-[0_20px_48px_rgba(0,0,0,0.16)]">
                <div className="h-16 rounded-[1rem]" style={{ backgroundColor: value }} />
                <p className="mt-3 text-[11px] font-black uppercase tracking-[0.1em]">{name}</p>
                <p className="mt-1 font-mono text-[10px] text-[#65726b]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
