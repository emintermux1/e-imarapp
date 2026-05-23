import { Compass, LocateFixed, MapPinned, Search, ShieldAlert, Star } from "lucide-react";

export function NativeMapCanvas({
  mode = "map",
  compact = false,
  onLocate,
  locateBusy = false,
  onFavorite,
  favoriteBusy = false,
  status
}: {
  mode?: "map" | "satellite" | "simulation";
  compact?: boolean;
  onLocate?: () => void;
  locateBusy?: boolean;
  onFavorite?: () => void;
  favoriteBusy?: boolean;
  status?: string;
}) {
  const isSatellite = mode === "satellite";
  const isSimulation = mode === "simulation";

  return (
    <div className={`relative min-h-[420px] overflow-hidden rounded-[1.8rem] border border-[#d7d0bc]/85 bg-[#d7dfd3] shadow-[0_20px_70px_rgba(37,48,42,0.12)] ${compact ? "h-[56dvh]" : "h-[calc(100dvh-9rem)] md:h-[calc(100dvh-6rem)]"}`}>
      <div className={`absolute inset-0 ${isSatellite ? "bg-[linear-gradient(135deg,#29362f_0%,#4d5f4d_48%,#948765_100%)]" : "bg-[linear-gradient(135deg,#d7dfd3_0%,#cfd9cf_46%,#e7e1d4_100%)]"}`} />
      <div className={`absolute inset-0 ${isSatellite ? "opacity-35 [background-image:radial-gradient(circle_at_20%_20%,rgba(220,230,205,.45)_0_8%,transparent_9%),radial-gradient(circle_at_70%_30%,rgba(70,105,82,.45)_0_12%,transparent_13%),radial-gradient(circle_at_42%_74%,rgba(130,112,78,.5)_0_15%,transparent_16%)]" : "opacity-25 [background-image:linear-gradient(90deg,rgba(63,82,72,0.14)_1px,transparent_1px),linear-gradient(rgba(63,82,72,0.14)_1px,transparent_1px)] [background-size:64px_64px]"}`} />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#fffaf0]/50 to-transparent" />

      <MapRoad className="left-[44%] top-[-16%] h-[136%] w-14 rotate-[18deg]" primary label="Fikirtepe Cd." />
      <MapRoad className="left-[10%] top-[5%] h-[120%] w-11 rotate-[-29deg]" label="Bağdat Sk." />
      <MapRoad className="right-[-7%] top-[10%] h-[96%] w-10 rotate-[63deg]" label="Plan yolu" />
      <MapRoad className="left-[52%] top-[30%] h-[70%] w-8 rotate-[84deg]" muted />

      <CadastralParcel className="left-[4%] top-[16%] h-[18%] w-[30%] -rotate-[7deg]" label="312/8" />
      <CadastralParcel className="right-[8%] top-[18%] h-[22%] w-[34%] rotate-[6deg]" label="1094/2" wide />
      <CadastralParcel className="bottom-[16%] left-[7%] h-[26%] w-[34%] rotate-[12deg]" label="721/4" />
      <CadastralParcel className="bottom-[16%] right-[18%] h-[17%] w-[27%] -rotate-[8deg]" label="889/11" />
      <CadastralParcel className="left-[38%] top-[22%] h-[15%] w-[20%] rotate-[17deg]" label="480/3" muted />

      <div className={`absolute left-[42%] top-[39%] h-[24%] w-[30%] -rotate-[13deg] border-2 ${isSimulation ? "border-[#2563eb] bg-[#2563eb]/10" : "border-[#c5463c] bg-[#c5463c]/8"} shadow-[0_16px_38px_rgba(42,52,45,0.12)] [clip-path:polygon(9%_16%,88%_5%,98%_28%,84%_89%,12%_96%,0_41%)]`}>
        <div className="absolute inset-[8%] border border-white/55 [clip-path:polygon(10%_17%,86%_6%,96%_28%,82%_88%,12%_94%,1%_42%)]" />
        {isSimulation ? <BuildingMass /> : null}
      </div>
      <div className="absolute left-[56.5%] top-[48.5%] h-4 w-4 rounded-full border-2 border-white bg-[#c5463c] shadow-[0_0_0_7px_rgba(197,70,60,0.14)]" />
      <div className="absolute left-[59%] top-[47.5%] rounded-full border border-[#c5463c]/55 bg-[#fffaf0]/94 px-3 py-1 text-xs font-extrabold text-[#c5463c] shadow-[0_10px_24px_rgba(37,48,42,0.12)]">1254 / 18</div>

      <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
        <div className="flex min-h-12 flex-1 items-center gap-3 rounded-full border border-[#d7d0bc]/85 bg-[#fffaf0]/90 px-4 shadow-[0_12px_36px_rgba(37,48,42,0.12)] backdrop-blur-2xl">
          <Search className="h-4 w-4 text-[#087d7f]" />
          <span className="truncate text-sm font-extrabold text-[#17231f]">Kadıköy 1254 / 18</span>
        </div>
        <button
          type="button"
          onClick={onLocate}
          disabled={!onLocate || locateBusy}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#17231f] text-[#fffaf0] shadow-[0_12px_30px_rgba(23,35,31,0.22)] disabled:opacity-55"
          aria-label="Konumuma git"
        >
          <LocateFixed className={`h-4 w-4 ${locateBusy ? "animate-pulse" : ""}`} />
        </button>
      </div>

      <div className="absolute right-4 top-24 grid gap-2">
        <Tool icon={Compass} label="Kuzey" dark />
        <Tool icon={MapPinned} label="Parsel" />
        {onFavorite ? <Tool icon={Star} label="Favorilere kaydet" onClick={onFavorite} busy={favoriteBusy} /> : null}
      </div>

      <div className="absolute bottom-4 left-4 right-4 rounded-[1.45rem] border border-[#d7d0bc]/85 bg-[#fffaf0]/92 p-4 shadow-[0_-12px_42px_rgba(37,48,42,0.16)] backdrop-blur-2xl md:left-auto md:w-[360px]">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#087d7f]">{isSatellite ? "Uydu önizleme" : isSimulation ? "3D yapı kütlesi" : "Parsel detayı"}</p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.05em] text-[#17231f]">Kadıköy 1254 / 18</h2>
        <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-2xl border border-[#d7d0bc]/85 bg-[#f6f1e6]/72 text-xs">
          <Metric label="Alan" value="482 m²" />
          <Metric label="Ölçek" value="1/1000" />
          <Metric label="Durum" value="Kontrol" />
        </div>
        <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-[#5f5847]"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#b57b1e]" />{status ?? "Parsel ve plan bilgileri ilgili kurum kayıtlarından kontrol edilmelidir."}</p>
      </div>
    </div>
  );
}

function Tool({ icon: Icon, label, dark = false, onClick, busy = false }: { icon: typeof Compass; label: string; dark?: boolean; onClick?: () => void; busy?: boolean }) {
  return <button type="button" onClick={onClick} disabled={busy} className={`grid h-11 w-11 place-items-center rounded-full border border-[#d7d0bc]/85 shadow-[0_10px_28px_rgba(37,48,42,0.12)] backdrop-blur-2xl disabled:opacity-55 ${dark ? "bg-[#17231f] text-[#fffaf0]" : "bg-[#fffaf0]/88 text-[#17231f]"}`} aria-label={label}><Icon className={`h-4 w-4 ${busy ? "animate-pulse" : ""}`} /></button>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="border-r border-[#d7d0bc]/85 p-2.5 last:border-r-0"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#65726b]">{label}</p><p className="mt-1 font-mono text-xs font-bold text-[#17231f]">{value}</p></div>;
}

function BuildingMass() {
  return <div className="absolute bottom-[18%] left-[28%] h-[58%] w-[44%] skew-x-[-10deg] bg-[#2563eb]/35 shadow-[inset_0_1px_0_rgba(255,255,255,.5),12px_-10px_0_rgba(37,99,235,.18)]" />;
}

function MapRoad({ className, label, primary = false, muted = false }: { className: string; label?: string; primary?: boolean; muted?: boolean }) {
  return <div className={`absolute ${className} rounded-full bg-[#fffaf0]/70 shadow-[inset_0_0_0_1px_rgba(123,136,119,0.14),0_0_0_1px_rgba(255,250,240,0.42)] ${primary ? "opacity-95" : muted ? "opacity-42" : "opacity-68"}`}>{label ? <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 whitespace-nowrap font-mono text-[10px] font-bold text-[#6d786f]/45">{label}</span> : null}</div>;
}

function CadastralParcel({ className, label, muted = false, wide = false }: { className: string; label: string; muted?: boolean; wide?: boolean }) {
  return <div className={`absolute border bg-[#edf0e7]/10 ${muted ? "border-[#5f8068]/18" : "border-[#4f735d]/26"} ${wide ? "rounded-[2.4rem]" : "rounded-[1.7rem]"} ${className}`}><span className="absolute left-4 top-3 rotate-[2deg] font-mono text-[10px] font-bold text-[#4e6559]/70">{label}</span><span className="absolute left-[16%] top-1/2 h-px w-[68%] rotate-[12deg] bg-white/35" /><span className="absolute left-[28%] top-[20%] h-[62%] w-px -rotate-[18deg] bg-[#5f8068]/12" /></div>;
}
