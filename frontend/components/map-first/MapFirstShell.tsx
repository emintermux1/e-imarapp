import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronUp,
  Compass,
  FileText,
  Layers,
  LocateFixed,
  MapPinned,
  Menu,
  Navigation,
  Ruler,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  X,
  type LucideIcon
} from "lucide-react";
import { sourceDotClass, statusCopy, type ProductizedSourceProbe, type StatusTone } from "@/lib/source-status";

type MapFirstShellProps = {
  sources: ProductizedSourceProbe[];
  generatedAt?: string;
  mode?: "home" | "parcel";
};

type ShellMode = NonNullable<MapFirstShellProps["mode"]>;

const sourceToneText: Record<StatusTone, string> = {
  good: "text-emerald-700",
  info: "text-cyan-700",
  warn: "text-amber-700",
  blocked: "text-rose-700",
  neutral: "text-stone-600"
};

const sourceToneBorder: Record<StatusTone, string> = {
  good: "border-emerald-300/70 bg-emerald-50/85",
  info: "border-cyan-300/70 bg-cyan-50/85",
  warn: "border-amber-300/70 bg-amber-50/85",
  blocked: "border-rose-300/70 bg-rose-50/85",
  neutral: "border-stone-300/70 bg-stone-50/85"
};

export function MapFirstShell({ sources, generatedAt, mode = "home" }: MapFirstShellProps) {
  const primarySources = sources.slice(0, 4);
  const blockedCount = sources.filter((source) => ["protected", "requires_credentials", "captcha_required", "unavailable", "not_ready"].includes(source.status)).length;

  return (
    <div className="relative min-h-screen min-h-[100dvh] overflow-hidden bg-[#dfe7dc] text-[#23302d]">
      <MapCanvas mode={mode} />
      <TopNavigation mode={mode} />
      <SearchDrawer mode={mode} sources={primarySources} generatedAt={generatedAt} />
      <FloatingMapControls />
      <LayerRail blockedCount={blockedCount} />
      <SourceStatusPill sources={primarySources} />
      <ParcelBottomSheet mode={mode} sources={primarySources} blockedCount={blockedCount} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#23302d]/18 via-transparent to-transparent md:hidden" />
    </div>
  );
}

function TopNavigation({ mode }: { mode: ShellMode }) {
  const isParcel = mode === "parcel";

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-[60] px-3 pt-3 md:z-30 md:px-5 md:pt-5">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-2">
        <div className="pointer-events-auto flex min-w-0 items-center gap-2 rounded-[1.45rem] border border-[#d6d0bf]/90 bg-[#fffaf0]/94 p-1.5 shadow-[0_18px_55px_rgba(43,55,47,0.18)] backdrop-blur-2xl">
          <button className="grid h-10 w-10 shrink-0 place-items-center rounded-[1.1rem] bg-[#23302d] text-[#fffaf0] transition-transform active:scale-[0.97]" aria-label="Navigasyon menüsünü aç">
            <Menu className="h-4 w-4" />
          </button>
          <Link href="/" className="min-w-0 pr-2 text-lg font-extrabold tracking-[-0.045em] md:text-xl">
            <span className="text-[#167c80]">e</span> imar
          </Link>
        </div>

        <div className="pointer-events-auto hidden items-center gap-2 rounded-[1.45rem] border border-[#d6d0bf]/90 bg-[#fffaf0]/94 px-3 py-2 shadow-[0_18px_55px_rgba(43,55,47,0.14)] backdrop-blur-2xl sm:flex">
          <span className="h-2 w-2 rounded-full bg-[#167c80]" />
          <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#65736e]">{isParcel ? "seçili parsel" : "harita ana ekranı"}</span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 rounded-[1.45rem] border border-[#d6d0bf]/90 bg-[#fffaf0]/94 p-1.5 shadow-[0_18px_55px_rgba(43,55,47,0.14)] backdrop-blur-2xl">
          <Link href="/parsel" className="inline-flex h-10 items-center gap-2 rounded-[1.1rem] bg-[#167c80] px-3 text-sm font-extrabold text-white transition-transform active:scale-[0.98] md:px-4">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Ada / parsel ara</span>
          </Link>
          <button className="grid h-10 w-10 place-items-center rounded-[1.1rem] border border-[#d6d0bf] bg-white/62 text-[#23302d] transition-transform active:scale-[0.97]" aria-label="Harita filtreleri">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

function SearchDrawer({ mode, sources, generatedAt }: { mode: ShellMode; sources: ProductizedSourceProbe[]; generatedAt?: string }) {
  const isParcel = mode === "parcel";

  return (
    <aside className="absolute left-3 right-3 top-[4.65rem] z-20 rounded-[1.7rem] border border-[#d6d0bf] bg-[#fffaf0]/96 p-2.5 shadow-[0_24px_80px_rgba(43,55,47,0.22)] backdrop-blur-2xl min-[520px]:left-4 min-[520px]:right-auto min-[520px]:w-[380px] md:bottom-5 md:left-5 md:top-[5.35rem] md:flex md:w-[400px] md:flex-col md:rounded-[2.1rem] md:p-4 xl:w-[430px]">
      <div className="hidden items-start justify-between gap-3 md:flex">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#167c80]">arama drawer</p>
          <h1 className="mt-1 text-3xl font-extrabold leading-[0.95] tracking-[-0.055em]">Parseli önce haritada bul.</h1>
          <p className="mt-2 max-w-[21rem] text-sm leading-6 text-[#65736e]">Adres, ada veya parsel gir; sonuç bottom-sheet içinde büyür, kaynak kanıtı saklanmaz.</p>
        </div>
        <button className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[#d6d0bf] bg-white/62 text-[#65736e]" aria-label="Arama panelini kapat">
          <X className="h-4 w-4" />
        </button>
      </div>

      <Link href="/parsel" className="flex min-h-13 items-center gap-3 rounded-[1.25rem] border border-[#d6d0bf] bg-white/72 px-3 py-2 text-left transition-transform active:scale-[0.98] min-[520px]:hidden">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#167c80]/10 text-[#167c80]">
          <Search className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#167c80]">ada / parsel ara</span>
          <span className="block truncate text-sm font-extrabold text-[#23302d]">{isParcel ? "Kadıköy • 1254 / 18" : "İstanbul için hızlı sorgu"}</span>
        </span>
        <ChevronUp className="h-4 w-4 rotate-90 text-[#65736e]" />
      </Link>

      <div className="hidden gap-2 min-[520px]:grid md:mt-4 md:gap-3">
        <div className="grid grid-cols-2 gap-2">
          <Field label="İl" value="İstanbul" />
          <Field label="İlçe" value={isParcel ? "Kadıköy" : "Pendik"} />
        </div>
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <Field label="Ada" value={isParcel ? "1254" : "123"} />
          <Field label="Parsel" value={isParcel ? "18" : "7"} />
          <Link href="/parsel" className="mt-[1.35rem] grid h-11 w-12 place-items-center rounded-2xl bg-[#167c80] text-white shadow-[0_10px_26px_rgba(22,124,128,0.24)] transition-transform active:scale-[0.97]" aria-label="Sorgula">
            <Search className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mt-3 hidden grid-cols-3 gap-2 min-[520px]:grid">
        <QuickAction href="/parsel" icon={MapPinned} label="Parsel" active />
        <QuickAction href="/plans" icon={Layers} label="Plan" />
        <QuickAction href="/reports" icon={FileText} label="Rapor" />
      </div>

      <div className="mt-3 hidden overflow-hidden rounded-[1.4rem] border border-[#d6d0bf] bg-[#f6f1e6]/90 min-[520px]:block md:flex-1">
        <div className="flex items-center justify-between border-b border-[#d6d0bf] px-3 py-2">
          <span className="text-xs font-extrabold text-[#65736e]">Kaynak durumu</span>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#167c80]">provenance</span>
        </div>
        <div className="divide-y divide-[#d6d0bf]">
          {sources.map((source) => (
            <SourceRow key={source.sourceId} source={source} />
          ))}
        </div>
      </div>

      <div className="mt-3 hidden rounded-[1.25rem] border border-amber-300/60 bg-amber-50/88 p-3 text-xs leading-5 text-amber-950 min-[520px]:block">
        Resmî sonuç etiketi doğrulanmış contract olmadan kullanılmaz. Bu ekran kaynak/provenance durumunu özellikle görünür bırakır.
        {generatedAt ? <span className="block font-bold">Güncelleme: {formatGeneratedAt(generatedAt)}</span> : null}
      </div>
    </aside>
  );
}

function ParcelBottomSheet({ mode, sources, blockedCount }: { mode: ShellMode; sources: ProductizedSourceProbe[]; blockedCount: number }) {
  const isParcel = mode === "parcel";
  const primaryTone = sources[0] ? statusCopy(sources[0].status).tone : "neutral";

  return (
    <section className="absolute inset-x-0 bottom-0 z-30 px-3 pb-3 md:left-auto md:right-5 md:w-[440px] md:px-0 md:pb-5 xl:w-[470px]">
      <div className="overflow-hidden rounded-t-[2.2rem] border border-[#d6d0bf] bg-[#fffaf0]/97 shadow-[0_-26px_80px_rgba(43,55,47,0.24)] backdrop-blur-2xl md:rounded-[2.15rem]">
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-[#d6d0bf] md:hidden" />
        <div className="p-4 md:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#167c80]">{isParcel ? "seçili parsel" : "sonuç bottom-sheet"}</p>
              <h2 className="mt-1 text-2xl font-extrabold leading-none tracking-[-0.05em] text-[#23302d] md:text-3xl">{isParcel ? "Kadıköy 1254 / 18" : "Haritadan parsel seç"}</h2>
              <p className="mt-2 max-w-[34rem] text-sm leading-6 text-[#65736e] max-[420px]:line-clamp-2">
                {isParcel
                  ? "Seçili geometri harita katmanında vurgulanır; imar ve mülkiyet iddiası kaynak doğrulaması olmadan resmî gösterilmez."
                  : "Sorgu başlatınca seçili geometri, plan katmanları ve kaynak kanıtı burada büyür."}
              </p>
            </div>
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#c5463c]/10 text-[#c5463c]">
              <MapPinned className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
            <Metric label="Alan" value={isParcel ? "482 m²" : "—"} />
            <Metric label="Ölçek" value="1/1000" />
            <Metric label="Blokaj" value={`${blockedCount}`} />
          </div>

          <div className={`mt-3 rounded-2xl border p-3 ${sourceToneBorder[primaryTone]}`}>
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#b57b1e]" />
              <p className="text-xs leading-5 text-[#5f5847]">Canlı kaynak erişimi engelli veya eksikse sonuç ön izleme olarak kalır; kullanıcıya resmî veri gibi sunulmaz.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
            <Link href="/reports" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#23302d] px-4 text-sm font-extrabold text-[#fffaf0] transition-transform active:scale-[0.98]">
              <FileText className="h-4 w-4" />
              Ön rapor taslağı
            </Link>
            <Link href="/sources" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#d6d0bf] bg-white/65 px-4 text-sm font-extrabold text-[#23302d] transition-transform active:scale-[0.98]">
              Kaynakları gör
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function MapCanvas({ mode }: { mode: ShellMode }) {
  const isParcel = mode === "parcel";

  return (
    <main className="absolute inset-0 overflow-hidden bg-[#dfe7dc]" aria-label="Parsel haritası">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,250,240,0.72),transparent_28%),radial-gradient(circle_at_78%_20%,rgba(177,199,207,0.5),transparent_24%),linear-gradient(135deg,#dfe7dc_0%,#cfdccb_48%,#e6e1d1_100%)]" />
      <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(90deg,rgba(63,83,72,0.12)_1px,transparent_1px),linear-gradient(rgba(63,83,72,0.12)_1px,transparent_1px)] [background-size:54px_54px]" />
      <div className="absolute inset-0 opacity-65 [background-image:linear-gradient(30deg,rgba(255,250,240,.66)_12%,transparent_12.5%,transparent_87%,rgba(255,250,240,.66)_87.5%,rgba(255,250,240,.66)),linear-gradient(150deg,rgba(255,250,240,.66)_12%,transparent_12.5%,transparent_87%,rgba(255,250,240,.66)_87.5%,rgba(255,250,240,.66)),linear-gradient(30deg,rgba(255,250,240,.66)_12%,transparent_12.5%,transparent_87%,rgba(255,250,240,.66)_87.5%,rgba(255,250,240,.66)),linear-gradient(150deg,rgba(255,250,240,.66)_12%,transparent_12.5%,transparent_87%,rgba(255,250,240,.66)_87.5%,rgba(255,250,240,.66))] [background-position:0_0,0_0,27px_47px,27px_47px] [background-size:54px_94px]" />

      <Road className="left-1/2 top-[-12%] h-[132%] w-12 -translate-x-1/2 rotate-[24deg]" />
      <Road className="bottom-[-13%] left-[29%] h-[135%] w-9 rotate-[-33deg]" muted />
      <Road className="right-[6%] top-[4%] h-[105%] w-8 rotate-[62deg]" muted />
      <div className="absolute right-[12%] top-[14%] h-20 w-60 rotate-[-16deg] rounded-full bg-[#9cb8c7]/70 blur-[0.3px]" />
      <div className="absolute bottom-[29%] right-[7%] h-24 w-72 rotate-[14deg] rounded-full bg-[#a7bfca]/65" />

      <ParcelBlock className="left-[6%] top-[15%] h-[16%] w-[31%] rotate-[-8deg]" label="312/8" />
      <ParcelBlock className="right-[7%] top-[17%] h-[24%] w-[34%] rotate-[8deg]" label="1094/2" />
      <ParcelBlock className="bottom-[20%] left-[9%] h-[25%] w-[35%] rotate-[13deg]" label="721/4" />
      <ParcelBlock className="bottom-[18%] right-[20%] h-[18%] w-[27%] rotate-[-9deg]" label="889/11" />
      <ParcelBlock className="left-[39%] top-[22%] h-[15%] w-[20%] rotate-[18deg]" label="480/3" subtle />

      <div className={`absolute left-[42%] top-[40%] h-[24%] w-[29%] rotate-[-14deg] rounded-[1.75rem] border-2 ${isParcel ? "border-[#c5463c] bg-[#c5463c]/16" : "border-[#167c80] bg-[#167c80]/12"} shadow-[0_18px_42px_rgba(84,78,62,0.18)]`}>
        <div className="absolute inset-2 rounded-[1.3rem] border border-white/70" />
        <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#c5463c] shadow-[0_0_0_7px_rgba(197,70,60,0.14)]" />
      </div>
      <div className="absolute left-[57%] top-[49%] rounded-full border border-[#c5463c]/60 bg-[#fffaf0] px-3 py-1 text-xs font-extrabold text-[#c5463c] shadow-[0_10px_24px_rgba(43,55,47,0.16)]">{isParcel ? "1254 / 18" : "123 / 7"}</div>

      <div className="absolute bottom-[18rem] left-4 hidden rounded-2xl border border-[#d6d0bf] bg-[#fffaf0]/90 p-2 shadow-[0_14px_35px_rgba(43,55,47,0.14)] backdrop-blur md:block">
        <div className="h-2 w-32 rounded-full bg-[#23302d]" />
        <div className="mt-1 text-center text-[10px] font-bold text-[#65736e]">200 m</div>
      </div>
    </main>
  );
}

function FloatingMapControls() {
  const controls: Array<{ icon: LucideIcon; label: string }> = [
    { icon: LocateFixed, label: "Konuma git" },
    { icon: Layers, label: "Katmanlar" },
    { icon: Ruler, label: "Ölçüm" },
    { icon: Navigation, label: "Yön" }
  ];

  return (
    <div className="absolute right-3 top-[8.75rem] z-20 grid gap-2 md:right-5 md:top-[6rem]">
      {controls.map((control) => {
        const Icon = control.icon;
        return (
          <button key={control.label} className="grid h-11 w-11 place-items-center rounded-2xl border border-[#d6d0bf] bg-[#fffaf0]/94 text-[#23302d] shadow-[0_12px_32px_rgba(43,55,47,0.16)] backdrop-blur-2xl transition-transform active:scale-[0.96]" aria-label={control.label}>
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
      <button className="mt-1 grid h-11 w-11 place-items-center rounded-full bg-[#23302d] text-[#fffaf0] shadow-[0_14px_34px_rgba(35,48,45,0.26)]" aria-label="Kuzey oku">
        <Compass className="h-4 w-4" />
      </button>
    </div>
  );
}

function LayerRail({ blockedCount }: { blockedCount: number }) {
  return (
    <div className="absolute bottom-[18.5rem] right-3 z-20 hidden w-[220px] rounded-[1.45rem] border border-[#d6d0bf] bg-[#fffaf0]/94 p-3 shadow-[0_18px_55px_rgba(43,55,47,0.16)] backdrop-blur-2xl lg:block">
      <div className="flex items-center justify-between">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#65736e]">katmanlar</p>
        <span className="font-mono text-xs font-bold text-[#c5463c]">{blockedCount}</span>
      </div>
      <div className="mt-3 grid gap-2">
        <LayerToggle icon={Building2} label="Yapı adaları" active />
        <LayerToggle icon={Layers} label="Plan katmanı" />
        <LayerToggle icon={CheckCircle2} label="Kaynak kanıtı" active />
      </div>
    </div>
  );
}

function SourceStatusPill({ sources }: { sources: ProductizedSourceProbe[] }) {
  const first = sources[0];
  if (!first) return null;
  const copy = statusCopy(first.status);

  return (
    <Link href="/sources" className="absolute bottom-[16rem] left-3 z-20 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full border border-[#d6d0bf] bg-[#fffaf0]/94 px-3 py-2 text-xs font-extrabold text-[#23302d] shadow-[0_14px_40px_rgba(43,55,47,0.16)] backdrop-blur-2xl md:left-auto md:right-5 md:bottom-[32rem]">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${sourceDotClass(copy.tone)}`} />
      <span className="truncate">{first.sourceName}: {copy.label}</span>
    </Link>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#65736e]">{label}</span>
      <input className="h-11 min-w-0 rounded-2xl border border-[#d6d0bf] bg-white/74 px-3 text-sm font-extrabold text-[#23302d] outline-none transition-colors placeholder:text-[#9ba49f] focus:border-[#167c80]" defaultValue={value} />
    </label>
  );
}

function QuickAction({ href, icon: Icon, label, active = false }: { href: string; icon: LucideIcon; label: string; active?: boolean }) {
  return (
    <Link href={href} className={`grid min-h-16 place-items-center rounded-2xl border p-2 text-center text-xs font-extrabold transition-transform active:scale-[0.98] ${active ? "border-[#167c80]/45 bg-[#167c80]/10 text-[#167c80]" : "border-[#d6d0bf] bg-white/58 text-[#23302d]"}`}>
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}

function SourceRow({ source }: { source: ProductizedSourceProbe }) {
  const copy = statusCopy(source.status);

  return (
    <div className="grid grid-cols-[auto_1fr] gap-2 px-3 py-2.5">
      <span className={`mt-1 h-2.5 w-2.5 rounded-full ${sourceDotClass(copy.tone)}`} />
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-extrabold text-[#23302d]">{source.sourceName}</p>
          <span className={`shrink-0 text-[10px] font-extrabold uppercase tracking-[0.08em] ${sourceToneText[copy.tone]}`}>{copy.label}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#65736e]">{source.message}</p>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[8.8rem] rounded-2xl border border-[#d6d0bf] bg-[#f6f1e6]/85 p-3 md:min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.11em] text-[#65736e]">{label}</p>
      <p className="mt-1 font-mono text-sm font-bold text-[#23302d]">{value}</p>
    </div>
  );
}

function LayerToggle({ icon: Icon, label, active = false }: { icon: LucideIcon; label: string; active?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#d6d0bf] bg-white/55 px-3 py-2">
      <span className="inline-flex items-center gap-2 text-xs font-bold text-[#23302d]"><Icon className="h-4 w-4 text-[#167c80]" />{label}</span>
      <span className={`h-5 w-9 rounded-full p-0.5 ${active ? "bg-[#167c80]" : "bg-[#d6d0bf]"}`}>
        <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${active ? "translate-x-4" : "translate-x-0"}`} />
      </span>
    </div>
  );
}

function Road({ className, muted = false }: { className: string; muted?: boolean }) {
  return <div className={`absolute ${className} bg-[#f7f4ea]/85 shadow-[0_0_0_1px_rgba(130,143,127,0.2)] ${muted ? "opacity-78" : "opacity-95"}`} />;
}

function ParcelBlock({ className, label, subtle = false }: { className: string; label: string; subtle?: boolean }) {
  return (
    <div className={`absolute rounded-[2rem] border ${subtle ? "border-[#b8c8b4] bg-[#cfdbc9]/42" : "border-[#9fb69f] bg-[#cbd9c7]/72"} shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] ${className}`}>
      <span className="absolute left-4 top-3 rounded-full bg-[#fffaf0]/72 px-2 py-0.5 font-mono text-[10px] font-bold text-[#65736e]">{label}</span>
    </div>
  );
}

function formatGeneratedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}
