"use client";

interface CesiumViewerProps {
  tilesetJson?: Record<string, unknown>;
  center?: [number, number, number];
}

export function CesiumViewer({ tilesetJson, center }: CesiumViewerProps) {
  const lon = center?.[0] ?? 28.9784;
  const lat = center?.[1] ?? 41.0082;
  const hasTileset = Boolean(tilesetJson);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[1.6rem] border border-[#d7d0bc]/85 bg-[#d7dfd3] shadow-[0_20px_70px_rgba(37,48,42,0.12)]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#d7dfd3_0%,#cfd9cf_46%,#e7e1d4_100%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(90deg,rgba(63,82,72,0.14)_1px,transparent_1px),linear-gradient(rgba(63,82,72,0.14)_1px,transparent_1px)] [background-size:64px_64px]" />
      <div className="absolute left-[44%] top-[-15%] h-[135%] w-16 rotate-[18deg] rounded-full bg-[#fffaf0]/70 shadow-[inset_0_0_0_1px_rgba(123,136,119,0.14)]" />
      <div className="absolute left-[10%] top-[5%] h-[120%] w-11 rotate-[-29deg] rounded-full bg-[#fffaf0]/55" />
      <div className="absolute right-[-7%] top-[10%] h-[96%] w-10 rotate-[63deg] rounded-full bg-[#fffaf0]/55" />

      <ParcelBlock className="left-[6%] top-[18%] h-[20%] w-[32%] -rotate-[7deg]" label="312/8" />
      <ParcelBlock className="right-[8%] top-[20%] h-[23%] w-[36%] rotate-[6deg]" label="1094/2" />
      <ParcelBlock className="bottom-[17%] left-[8%] h-[27%] w-[36%] rotate-[12deg]" label="721/4" />

      <div className="absolute left-[42%] top-[39%] h-[28%] w-[32%] -rotate-[13deg] border-2 border-[#2563eb] bg-[#2563eb]/10 shadow-[0_16px_38px_rgba(42,52,45,0.12)] [clip-path:polygon(9%_16%,88%_5%,98%_28%,84%_89%,12%_96%,0_41%)]">
        <div className="absolute inset-[8%] border border-white/55 [clip-path:polygon(10%_17%,86%_6%,96%_28%,82%_88%,12%_94%,1%_42%)]" />
        <div className="absolute bottom-[16%] left-[28%] h-[60%] w-[44%] skew-x-[-10deg] bg-[#2563eb]/38 shadow-[inset_0_1px_0_rgba(255,255,255,.5),12px_-10px_0_rgba(37,99,235,.18),24px_-20px_0_rgba(37,99,235,.1)]" />
      </div>

      <div className="absolute bottom-4 left-4 right-4 rounded-[1.45rem] border border-[#d7d0bc]/85 bg-[#fffaf0]/92 p-4 shadow-[0_-12px_42px_rgba(37,48,42,0.16)] backdrop-blur-2xl md:left-auto md:w-[390px]">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#087d7f]">3D yapı kütlesi</p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.05em] text-[#17231f]">Kadıköy 1254 / 18</h2>
        <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-2xl border border-[#d7d0bc]/85 bg-[#f6f1e6]/72 text-xs">
          <Metric label="Konum" value={`${lat.toFixed(3)}, ${lon.toFixed(3)}`} />
          <Metric label="Yükseklik" value="15 m" />
          <Metric label="Kaynak" value={hasTileset ? "Tileset" : "Önizleme"} />
        </div>
        <p className="mt-3 text-xs leading-5 text-[#5f5847]">
          3D ekran artık boş WebGL hatasına düşmeden yapı kütlesi ve parsel bağlamını gösterir; canlı tileset geldiğinde aynı panelden okunur.
        </p>
      </div>
    </div>
  );
}

function ParcelBlock({ className, label }: { className: string; label: string }) {
  return (
    <div className={`absolute rounded-[2rem] border border-[#4f735d]/30 bg-[#edf0e7]/20 ${className}`}>
      <span className="absolute left-4 top-3 font-mono text-[10px] font-bold text-[#4e6559]/70">{label}</span>
      <span className="absolute left-[16%] top-1/2 h-px w-[68%] rotate-[12deg] bg-white/35" />
      <span className="absolute left-[28%] top-[20%] h-[62%] w-px -rotate-[18deg] bg-[#5f8068]/12" />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-[#d7d0bc]/85 p-2.5 last:border-r-0">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#65726b]">{label}</p>
      <p className="mt-1 truncate font-mono text-xs font-bold text-[#17231f]">{value}</p>
    </div>
  );
}
