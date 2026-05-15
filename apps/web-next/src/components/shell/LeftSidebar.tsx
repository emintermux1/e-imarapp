"use client";

import { LayerToggle } from "../domain/Cards";

export function LeftSidebar() {
  return (
    <aside className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
      <h2 className="text-sm font-semibold text-slate-900">Katman Yönetimi</h2>
      <LayerToggle checked label="Parsel" onChange={() => undefined} />
      <LayerToggle checked label="İmar/Zoning" onChange={() => undefined} />
      <LayerToggle checked label="İdari Sınır" onChange={() => undefined} />
      <LayerToggle checked={false} label="Doğal Risk" onChange={() => undefined} />
      <LayerToggle checked={false} label="Askı Planları" onChange={() => undefined} />

      <div className="rounded-lg border border-slate-200 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kayıtlı Sorgular</h3>
        <ul className="mt-2 space-y-2 text-sm text-slate-700">
          <li>İstanbul / Kadıköy / 123 / 45</li>
          <li>Ankara / Çankaya / 67 / 12</li>
          <li>İzmir / Konak / 512 / 3</li>
        </ul>
      </div>

      <div className="rounded-lg border border-slate-200 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Parsel Alarm</h3>
        <p className="mt-1 text-sm text-slate-700">4 aktif parsel alarmı, 2 belediye kararı alarmı</p>
      </div>
    </aside>
  );
}
