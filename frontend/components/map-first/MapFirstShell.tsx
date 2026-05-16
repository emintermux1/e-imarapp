import Link from "next/link";
import {
  ArrowUpRight,
  ChevronRight,
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

const blockedStatuses = ["protected", "requires_credentials", "captcha_required", "unavailable", "not_ready"];

export function MapFirstShell({ sources, generatedAt, mode = "home" }: MapFirstShellProps) {
  const visibleSources = sources.slice(0, 3);
  const blockedCount = sources.filter((source) => blockedStatuses.includes(source.status)).length;

  return (
    <div className="relative min-h-screen min-h-[100dvh] overflow-hidden bg-[#d8e0d2] text-[#17231f]">
      <MapCanvas mode={mode} />
      <MapTopBar mode={mode} />
      <DesktopSearchDrawer mode={mode} sources={visibleSources} generatedAt={generatedAt} />
      <MobileSearchPill mode={mode} />
      <MapToolStack />
      <MapScale />
      <ParcelBottomSheet mode={mode} sources={visibleSources} blockedCount={blockedCount} />
    </div>
  );
}

function MapTopBar({ mode }: { mode: ShellMode }) {
  const isParcel = mode === "parcel";

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-40 px-4 pt-4 md:px-6 md:pt-5">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3">
        <div className="pointer-events-auto flex h-12 items-center gap-2 rounded-full border border-[#d7d0bc]/80 bg-[#fffaf0]/90 px-1.5 pr-4 shadow-[0_10px_32px_rgba(37,48,42,0.14)] backdrop-blur-2xl">
          <button className="grid h-9 w-9 place-items-center rounded-full bg-[#17231f] text-[#fffaf0] transition-transform active:scale-[0.96]" aria-label="Menüyü aç">
            <Menu className="h-4 w-4" />
          </button>
          <Link href="/" className="text-lg font-extrabold tracking-[-0.05em]">
            <span className="text-[#087d7f]">e</span> imar
          </Link>
        </div>

        <div className="pointer-events-auto hidden items-center gap-2 rounded-full border border-[#d7d0bc]/80 bg-[#fffaf0]/86 px-4 py-2 shadow-[0_10px_32px_rgba(37,48,42,0.1)] backdrop-blur-2xl sm:flex">
          <span className="h-2 w-2 rounded-full bg-[#087d7f]" />
          <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#65726b]">{isParcel ? "parsel detayı" : "parsel haritası"}</span>
        </div>

        <div className="pointer-events-auto hidden items-center gap-2 rounded-full border border-[#d7d0bc]/80 bg-[#fffaf0]/90 p-1.5 shadow-[0_10px_32px_rgba(37,48,42,0.12)] backdrop-blur-2xl min-[520px]:flex">
          <Link href="/parsel" className="inline-flex h-9 items-center gap-2 rounded-full bg-[#087d7f] px-4 text-sm font-extrabold text-white transition-transform active:scale-[0.98]">
            <Search className="h-4 w-4" />
            Ada / parsel ara
          </Link>
          <button className="grid h-9 w-9 place-items-center rounded-full text-[#17231f] transition-colors hover:bg-[#17231f]/6" aria-label="Filtreler">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

function MobileSearchPill({ mode }: { mode: ShellMode }) {
  const isParcel = mode === "parcel";

  return (
    <Link href="/parsel" className="absolute left-4 right-4 top-[4.8rem] z-30 flex min-h-14 items-center gap-3 rounded-[1.35rem] border border-[#d7d0bc]/85 bg-[#fffaf0]/92 px-3 shadow-[0_16px_44px_rgba(37,48,42,0.14)] backdrop-blur-2xl transition-transform active:scale-[0.99] md:hidden">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#087d7f]/10 text-[#087d7f]">
        <Search className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#087d7f]">Ada / parsel ara</span>
        <span className="block truncate text-sm font-extrabold tracking-[-0.01em] text-[#17231f]">{isParcel ? "Kadıköy · 1254 / 18" : "İlçe, ada ve parsel no ile sorgula"}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-[#65726b]" />
    </Link>
  );
}

function DesktopSearchDrawer({ mode, sources, generatedAt }: { mode: ShellMode; sources: ProductizedSourceProbe[]; generatedAt?: string }) {
  const isParcel = mode === "parcel";

  return (
    <aside className="absolute bottom-6 left-6 top-[5.5rem] z-30 hidden w-[372px] flex-col rounded-[1.8rem] border border-[#d7d0bc]/85 bg-[#fffaf0]/92 p-4 shadow-[0_24px_72px_rgba(37,48,42,0.16)] backdrop-blur-2xl md:flex xl:w-[392px]">
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#087d7f]">Parsel arama</p>
        <h1 className="mt-2 text-[2rem] font-extrabold leading-[0.94] tracking-[-0.06em]">Parseli haritada görüntüle.</h1>
        <p className="mt-3 text-sm leading-6 text-[#65726b]">İlçe, ada ve parsel bilgisiyle arama yap; parsel sınırı, plan ölçeği ve kaynak durumu aynı ekranda görünsün.</p>
      </div>

      <div className="mt-5 grid gap-3">
        <div className="grid grid-cols-2 gap-2">
          <Field label="İl" value="İstanbul" />
          <Field label="İlçe" value={isParcel ? "Kadıköy" : "Pendik"} />
        </div>
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <Field label="Ada" value={isParcel ? "1254" : "123"} />
          <Field label="Parsel" value={isParcel ? "18" : "7"} />
          <Link href="/parsel" className="mt-[1.35rem] grid h-11 w-12 place-items-center rounded-2xl bg-[#087d7f] text-white shadow-[0_10px_24px_rgba(8,125,127,0.24)] transition-transform active:scale-[0.97]" aria-label="Sorgula">
            <Search className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <QuickAction href="/parsel" icon={MapPinned} label="Parsel" active />
        <QuickAction href="/plans" icon={Layers} label="Plan" />
        <QuickAction href="/reports" icon={FileText} label="Rapor" />
      </div>

      <div className="mt-4 flex-1 overflow-hidden rounded-[1.35rem] border border-[#d7d0bc]/85 bg-[#f6f1e6]/70">
        <div className="flex items-center justify-between border-b border-[#d7d0bc]/80 px-3 py-2.5">
          <span className="text-xs font-extrabold text-[#65726b]">Veri kaynakları</span>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#087d7f]">durum</span>
        </div>
        <div className="divide-y divide-[#d7d0bc]/80">
          {sources.map((source) => (
            <SourceRow key={source.sourceId} source={source} />
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-[1.25rem] border border-amber-300/65 bg-amber-50/80 p-3 text-xs leading-5 text-amber-950">
        Parsel ve plan bilgileri ilgili kurum kayıtlarından kontrol edilmelidir.
        {generatedAt ? <span className="block font-bold">Güncelleme: {formatGeneratedAt(generatedAt)}</span> : null}
      </div>
    </aside>
  );
}

function ParcelBottomSheet({ mode, sources, blockedCount }: { mode: ShellMode; sources: ProductizedSourceProbe[]; blockedCount: number }) {
  const isParcel = mode === "parcel";
  const firstSource = sources[0];
  const firstCopy = firstSource ? statusCopy(firstSource.status) : null;

  return (
    <section className="absolute inset-x-0 bottom-0 z-40 px-3 pb-3 md:left-auto md:right-6 md:w-[430px] md:px-0 md:pb-6 xl:w-[455px]">
      <div className="overflow-hidden rounded-[2rem] border border-[#d7d0bc]/85 bg-[#fffaf0]/94 shadow-[0_-18px_54px_rgba(37,48,42,0.18)] backdrop-blur-2xl md:rounded-[1.9rem]">
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-[#d7d0bc] md:hidden" />
        <div className="p-4 md:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#087d7f]">{isParcel ? "Parsel detayı" : "Parsel arama"}</p>
              <h2 className="mt-1 text-2xl font-extrabold leading-none tracking-[-0.055em] text-[#17231f] md:text-[2rem]">{isParcel ? "Kadıköy 1254 / 18" : "Haritadan seç"}</h2>
              <p className="mt-2 text-sm leading-6 text-[#65726b] max-[420px]:line-clamp-2">
                {isParcel
                  ? "Parsel sınırı haritada işaretlendi. Alan, plan ölçeği ve kaynak durumu aşağıda özetlenir."
                  : "Ada ve parsel bilgisi girildiğinde sınır, alan ve plan bilgileri burada özetlenir."}
              </p>
            </div>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#c5463c]/10 text-[#c5463c]">
              <MapPinned className="h-5 w-5" />
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-[1.25rem] border border-[#d7d0bc]/85 bg-[#f6f1e6]/72">
            <Metric label="Alan" value={isParcel ? "482 m²" : "—"} />
            <Metric label="Ölçek" value="1/1000" />
            <Metric label="Blokaj" value={`${blockedCount}`} />
          </div>

          <div className="mt-3 rounded-[1.25rem] border border-amber-300/70 bg-amber-50/78 p-3">
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#b57b1e]" />
              <p className="text-xs leading-5 text-[#5f5847]">
                {firstCopy && firstSource ? `${firstSource.sourceName}: ${firstCopy.label}. ` : null}
                Parsel ve plan bilgileri ilgili kurum kayıtlarından kontrol edilmelidir.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/reports" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#17231f] px-4 text-sm font-extrabold text-[#fffaf0] transition-transform active:scale-[0.98]">
              <FileText className="h-4 w-4" />
              Rapor
            </Link>
            <Link href="/sources" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#d7d0bc] bg-white/65 px-4 text-sm font-extrabold text-[#17231f] transition-transform active:scale-[0.98]">
              Kaynaklar
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
    <main className="absolute inset-0 overflow-hidden bg-[#d8e0d2]" aria-label="Parsel haritası">
      <div className="absolute inset-0 bg-[linear-gradient(145deg,#d8e0d2_0%,#ccd9cb_48%,#e7e2d4_100%)]" />
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(90deg,rgba(57,78,67,0.12)_1px,transparent_1px),linear-gradient(rgba(57,78,67,0.12)_1px,transparent_1px)] [background-size:64px_64px]" />
      <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-[#fffaf0]/55 to-transparent" />

      <MapRoad className="left-[42%] top-[-10%] h-[122%] w-16 rotate-[19deg]" primary />
      <MapRoad className="left-[9%] top-[7%] h-[112%] w-12 rotate-[-28deg]" />
      <MapRoad className="right-[-4%] top-[12%] h-[90%] w-10 rotate-[64deg]" />
      <div className="absolute right-[11%] top-[14%] h-14 w-52 rotate-[-14deg] rounded-full bg-[#8fb2c0]/52" />

      <ParcelOutline className="left-[5%] top-[17%] h-[17%] w-[31%] rotate-[-7deg]" label="312/8" />
      <ParcelOutline className="right-[8%] top-[19%] h-[22%] w-[33%] rotate-[7deg]" label="1094/2" />
      <ParcelOutline className="bottom-[18%] left-[8%] h-[25%] w-[33%] rotate-[12deg]" label="721/4" />
      <ParcelOutline className="bottom-[17%] right-[19%] h-[17%] w-[27%] rotate-[-8deg]" label="889/11" />
      <ParcelOutline className="left-[38%] top-[23%] h-[15%] w-[20%] rotate-[17deg]" label="480/3" muted />

      <div className={`absolute left-[42%] top-[39%] h-[24%] w-[30%] rotate-[-13deg] rounded-[1.65rem] border-2 ${isParcel ? "border-[#c5463c] bg-[#c5463c]/9" : "border-[#087d7f] bg-[#087d7f]/8"} shadow-[0_16px_38px_rgba(42,52,45,0.12)]`}>
        <div className="absolute inset-2 rounded-[1.2rem] border border-white/60" />
      </div>
      <div className="absolute left-[56.5%] top-[48.5%] h-4 w-4 rounded-full border-2 border-white bg-[#c5463c] shadow-[0_0_0_7px_rgba(197,70,60,0.14)]" />
      <div className="absolute left-[59%] top-[47.5%] rounded-full border border-[#c5463c]/55 bg-[#fffaf0]/94 px-3 py-1 text-xs font-extrabold text-[#c5463c] shadow-[0_10px_24px_rgba(37,48,42,0.12)]">{isParcel ? "1254 / 18" : "123 / 7"}</div>
    </main>
  );
}

function MapToolStack() {
  const controls: Array<{ icon: LucideIcon; label: string }> = [
    { icon: LocateFixed, label: "Konuma git" },
    { icon: Layers, label: "Katmanlar" },
    { icon: Ruler, label: "Ölçüm" },
    { icon: Navigation, label: "Yön" }
  ];

  return (
    <div className="absolute right-4 top-[9.25rem] z-30 grid gap-2 md:right-6 md:top-[6rem]">
      {controls.map((control) => {
        const Icon = control.icon;
        return (
          <button key={control.label} className="grid h-10 w-10 place-items-center rounded-full border border-[#d7d0bc]/85 bg-[#fffaf0]/88 text-[#17231f] shadow-[0_10px_28px_rgba(37,48,42,0.12)] backdrop-blur-2xl transition-transform active:scale-[0.96]" aria-label={control.label}>
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
      <button className="grid h-10 w-10 place-items-center rounded-full bg-[#17231f] text-[#fffaf0] shadow-[0_12px_30px_rgba(23,35,31,0.22)]" aria-label="Kuzey oku">
        <Compass className="h-4 w-4" />
      </button>
    </div>
  );
}

function MapScale() {
  return (
    <div className="absolute bottom-[17rem] left-6 z-20 hidden rounded-full border border-[#d7d0bc]/85 bg-[#fffaf0]/86 px-3 py-2 shadow-[0_10px_28px_rgba(37,48,42,0.1)] backdrop-blur-2xl md:block">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-24 rounded-full bg-[#17231f]" />
        <span className="font-mono text-[10px] font-bold text-[#65726b]">200 m</span>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#65726b]">{label}</span>
      <input className="h-11 min-w-0 rounded-2xl border border-[#d7d0bc] bg-white/72 px-3 text-sm font-extrabold text-[#17231f] outline-none transition-colors focus:border-[#087d7f]" defaultValue={value} />
    </label>
  );
}

function QuickAction({ href, icon: Icon, label, active = false }: { href: string; icon: LucideIcon; label: string; active?: boolean }) {
  return (
    <Link href={href} className={`grid min-h-14 place-items-center rounded-2xl border p-2 text-center text-xs font-extrabold transition-transform active:scale-[0.98] ${active ? "border-[#087d7f]/45 bg-[#087d7f]/10 text-[#087d7f]" : "border-[#d7d0bc] bg-white/50 text-[#17231f]"}`}>
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
          <p className="truncate text-xs font-extrabold text-[#17231f]">{source.sourceName}</p>
          <span className={`shrink-0 text-[10px] font-extrabold uppercase tracking-[0.08em] ${sourceToneText[copy.tone]}`}>{copy.label}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#65726b]">{source.message}</p>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-[#d7d0bc]/85 p-3 last:border-r-0">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#65726b]">{label}</p>
      <p className="mt-1 font-mono text-sm font-bold text-[#17231f]">{value}</p>
    </div>
  );
}

function MapRoad({ className, primary = false }: { className: string; primary?: boolean }) {
  return <div className={`absolute ${className} rounded-full bg-[#fffaf0]/72 shadow-[0_0_0_1px_rgba(123,136,119,0.12)] ${primary ? "opacity-95" : "opacity-70"}`} />;
}

function ParcelOutline({ className, label, muted = false }: { className: string; label: string; muted?: boolean }) {
  return (
    <div className={`absolute rounded-[2rem] border bg-transparent ${muted ? "border-[#809a86]/22" : "border-[#5f8068]/28"} ${className}`}>
      <span className="absolute left-4 top-3 rotate-[2deg] font-mono text-[10px] font-bold text-[#4e6559]/70">{label}</span>
    </div>
  );
}

function formatGeneratedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}
