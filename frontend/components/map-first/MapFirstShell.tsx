import Link from "next/link";
import { ArrowRight, FileText, Layers, LocateFixed, MapPinned, Search, ShieldCheck } from "lucide-react";
import { SourceReadinessStrip } from "@/components/home/SourceReadinessStrip";
import type { ProductizedSourceProbe } from "@/lib/source-status";

type MapFirstShellProps = {
  sources: ProductizedSourceProbe[];
  generatedAt?: string;
  mode?: "home" | "parcel";
};

export function MapFirstShell({ sources, generatedAt, mode = "home" }: MapFirstShellProps) {
  return (
    <div className="relative -mx-4 -my-4 min-h-[100dvh] overflow-hidden bg-[#e8ece4] text-[#23302e] md:-mx-8 md:-my-8">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(35,48,46,0.07)_1px,transparent_1px),linear-gradient(rgba(35,48,46,0.07)_1px,transparent_1px)] bg-[size:52px_52px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_42%,rgba(22,124,128,0.18),transparent_24%),radial-gradient(circle_at_74%_68%,rgba(93,130,86,0.18),transparent_18%)]" />
      <div className="relative grid min-h-[100dvh] grid-rows-[auto_1fr] md:grid-cols-[390px_1fr] md:grid-rows-1">
        <aside className="z-10 border-b border-[#c8d0c2] bg-[#fffaf0]/96 p-4 shadow-[0_16px_44px_rgba(54,65,55,0.14)] backdrop-blur md:border-b-0 md:border-r md:p-5">
          <div className="mb-5 flex items-center justify-between">
            <Link href="/" className="text-2xl font-extrabold tracking-tight">
              <span className="text-[#167c80]">e</span> imar
            </Link>
            <span className="rounded-full border border-[#c9d8d3] bg-[#e5f4f1] px-3 py-1 text-xs font-semibold text-[#167c80]">beta</span>
          </div>

          <div className="rounded-[1.5rem] border border-[#d8cdb9] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#167c80]">Parsel sorgusu</p>
            <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-[-0.035em] text-[#23302e]">
              Harita üstünde ada/parsel sonucu.
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#66736f]">
              Parsel sitesindeki gibi önce harita; arama paneli sonucu haritada ve altta raporda açar.
            </p>

            <div className="mt-5 grid gap-3">
              <Field label="İl" placeholder="İstanbul" />
              <Field label="İlçe / belediye" placeholder="Pendik" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ada" placeholder="123" />
                <Field label="Parsel" placeholder="7" />
              </div>
              <Link href="/parsel" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#167c80] px-5 text-sm font-bold text-white transition-transform active:translate-y-0.5">
                <Search className="h-4 w-4" />
                Sorgula ve haritada göster
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Action href="/parsel" icon={Search} label="Ada/parsel" />
            <Action href="/map" icon={MapPinned} label="Harita" />
            <Action href="/reports" icon={FileText} label="Rapor" />
          </div>

          <div className="mt-4 hidden md:block">
            <SourceReadinessStrip sources={sources} generatedAt={generatedAt} compact />
          </div>
        </aside>

        <main className="relative min-h-[calc(100dvh-410px)] md:min-h-[100dvh]">
          <MapCanvas mode={mode} />
          <div className="absolute left-3 right-3 top-3 z-10 flex items-center justify-between gap-3 md:left-5 md:right-5 md:top-5">
            <div className="rounded-2xl border border-[#c8d0c2] bg-[#fffaf0]/92 px-3 py-2 text-xs font-semibold text-[#23302e] shadow-sm backdrop-blur">
              TKGM / Belediye / e-Plan kaynakları dürüst durumla gösterilir
            </div>
            <button className="hidden min-h-11 items-center gap-2 rounded-2xl border border-[#c8d0c2] bg-[#fffaf0]/92 px-4 text-sm font-semibold text-[#23302e] shadow-sm backdrop-blur md:inline-flex">
              <Layers className="h-4 w-4 text-[#167c80]" />
              Katmanlar
            </button>
          </div>

          <div className="absolute inset-x-3 bottom-3 z-10 rounded-[1.5rem] border border-[#c8d0c2] bg-[#fffaf0]/96 p-4 shadow-[0_16px_44px_rgba(54,65,55,0.16)] backdrop-blur md:left-auto md:right-5 md:w-[380px]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#167c80]">Sonuç paneli</p>
                <h2 className="mt-1 text-xl font-bold text-[#23302e]">{mode === "parcel" ? "Ada/parsel sorgu hazır" : "Haritadan veya panelden sorgula"}</h2>
                <p className="mt-2 text-sm leading-6 text-[#66736f]">Sonuç geldiğinde geometri, kaynak kanıtı, tarih ve “resmî değildir” uyarısı bu panelde görünür.</p>
              </div>
              <ShieldCheck className="h-5 w-5 shrink-0 text-[#167c80]" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <Badge label="Kaynak" value="metadata" />
              <Badge label="Harita" value="hazır" />
              <Badge label="Rapor" value="çıktı" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold text-[#5f6b67]">{label}</span>
      <input className="min-h-11 rounded-xl border border-[#d8cdb9] bg-[#fffaf0] px-3 text-sm text-[#23302e] outline-none placeholder:text-[#9aa29e] focus:border-[#167c80]" placeholder={placeholder} />
    </label>
  );
}

function Action({ href, icon: Icon, label }: { href: string; icon: typeof Search; label: string }) {
  return (
    <Link href={href} className="grid min-h-20 place-items-center rounded-2xl border border-[#d8cdb9] bg-[#fffaf0] p-2 text-center text-xs font-semibold text-[#23302e] transition-colors hover:border-[#167c80]/50">
      <Icon className="h-5 w-5 text-[#167c80]" />
      <span>{label}</span>
    </Link>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#d8cdb9] bg-[#f6f1e8] p-2">
      <p className="text-[#7b837f]">{label}</p>
      <p className="mt-1 font-semibold text-[#23302e]">{value}</p>
    </div>
  );
}

function MapCanvas({ mode }: { mode: "home" | "parcel" }) {
  const parcelTone = mode === "parcel" ? "border-[#d64545] bg-[#d64545]/15" : "border-[#167c80] bg-[#167c80]/10";
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#dfe7dc]">
      <div className="absolute inset-0 opacity-80 [background-image:linear-gradient(30deg,rgba(255,255,255,.55)_12%,transparent_12.5%,transparent_87%,rgba(255,255,255,.55)_87.5%,rgba(255,255,255,.55)),linear-gradient(150deg,rgba(255,255,255,.55)_12%,transparent_12.5%,transparent_87%,rgba(255,255,255,.55)_87.5%,rgba(255,255,255,.55)),linear-gradient(30deg,rgba(255,255,255,.55)_12%,transparent_12.5%,transparent_87%,rgba(255,255,255,.55)_87.5%,rgba(255,255,255,.55)),linear-gradient(150deg,rgba(255,255,255,.55)_12%,transparent_12.5%,transparent_87%,rgba(255,255,255,.55)_87.5%,rgba(255,255,255,.55))] [background-position:0_0,0_0,26px_45px,26px_45px] [background-size:52px_90px]" />
      <div className="absolute left-[8%] top-[16%] h-[18%] w-[28%] rotate-[-8deg] rounded-[2rem] border border-[#9bb69f] bg-[#cbd9c7]/70" />
      <div className="absolute right-[12%] top-[18%] h-[24%] w-[32%] rotate-[9deg] rounded-[2rem] border border-[#9bb69f] bg-[#cbd9c7]/70" />
      <div className="absolute bottom-[18%] left-[18%] h-[27%] w-[34%] rotate-[12deg] rounded-[2rem] border border-[#9bb69f] bg-[#cbd9c7]/70" />
      <div className={`absolute left-[46%] top-[42%] h-[22%] w-[24%] rotate-[-15deg] rounded-[1.75rem] border-2 ${parcelTone} shadow-[0_12px_32px_rgba(214,69,69,0.12)]`} />
      <div className="absolute left-[57%] top-[50%] rounded-full border border-[#d64545] bg-[#fffaf0] px-3 py-1 text-xs font-bold text-[#d64545] shadow-sm">123 / 7</div>
      <div className="absolute bottom-[34%] right-[20%] h-16 w-44 rotate-[-18deg] rounded-full bg-[#9eb5c2]/70" />
      <div className="absolute left-1/2 top-0 h-full w-9 rotate-[24deg] bg-[#eef1e9]/80" />
      <div className="absolute bottom-0 left-[34%] h-full w-7 rotate-[-32deg] bg-[#eef1e9]/70" />
      <button className="absolute bottom-32 left-5 hidden min-h-11 items-center gap-2 rounded-2xl border border-[#c8d0c2] bg-[#fffaf0]/92 px-4 text-sm font-semibold text-[#23302e] shadow-sm backdrop-blur md:inline-flex">
        <LocateFixed className="h-4 w-4 text-[#167c80]" />
        Konuma git
      </button>
      <div className="absolute bottom-20 left-5 hidden rounded-2xl border border-[#c8d0c2] bg-[#fffaf0]/92 p-2 shadow-sm backdrop-blur md:block">
        <div className="h-2 w-32 rounded-full bg-[#23302e]" />
        <div className="mt-1 text-center text-[10px] font-semibold text-[#66736f]">200 m</div>
      </div>
    </div>
  );
}
