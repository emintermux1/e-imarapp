import type { ParcelProps } from "@/types/parcel";
import { adaParselText, formatArea } from "@/lib/format";

export function downloadParcelPdfReport(parcel: ParcelProps) {
  const html = buildReportHtml(parcel);
  const reportWindow = window.open("", "_blank", "noopener,noreferrer,width=1080,height=860");
  if (!reportWindow) return;
  reportWindow.document.open();
  reportWindow.document.write(html);
  reportWindow.document.close();
  reportWindow.focus();
  reportWindow.print();
}

function buildReportHtml(parcel: ParcelProps) {
  const title = `Parsel Raporu - ${adaParselText(parcel.ada, parcel.parsel)}`;
  const generatedAt = new Date().toLocaleString("tr-TR");
  const potential = Math.round(parcel.yuzolcumuM2 * parcel.kaks);
  return `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      body { font-family: Inter, Arial, sans-serif; color: #0f172a; margin: 24px; }
      h1 { margin: 0 0 4px; font-size: 20px; }
      h2 { margin: 20px 0 8px; font-size: 15px; }
      .muted { color: #475569; font-size: 12px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 14px; }
      .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; }
      .k { color: #64748b; font-size: 11px; text-transform: uppercase; }
      .v { margin-top: 2px; font-weight: 600; font-size: 14px; }
      ul { margin: 8px 0 0; padding-left: 18px; }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
    <div class="muted">Üretim zamanı: ${generatedAt}</div>
    <h2>Konum ve Kimlik</h2>
    <div class="grid">
      <div class="card"><div class="k">İl / İlçe</div><div class="v">${parcel.il} / ${parcel.ilce}</div></div>
      <div class="card"><div class="k">Mahalle</div><div class="v">${parcel.mahalle}</div></div>
      <div class="card"><div class="k">Ada / Parsel</div><div class="v">${adaParselText(parcel.ada, parcel.parsel)}</div></div>
      <div class="card"><div class="k">Yüzölçümü</div><div class="v">${formatArea(parcel.yuzolcumuM2)}</div></div>
    </div>
    <h2>İmar ve Potansiyel</h2>
    <div class="grid">
      <div class="card"><div class="k">Plan</div><div class="v">${parcel.planAdi}</div></div>
      <div class="card"><div class="k">Fonksiyon</div><div class="v">${parcel.zoningType}</div></div>
      <div class="card"><div class="k">KAKS / TAKS</div><div class="v">${parcel.kaks.toFixed(2)} / ${parcel.taks.toFixed(2)}</div></div>
      <div class="card"><div class="k">Tahmini İnşaat Alanı</div><div class="v">${potential.toLocaleString("tr-TR")} m²</div></div>
    </div>
    <h2>Risk ve Çevre</h2>
    <div class="grid">
      <div class="card"><div class="k">Deprem / Sel</div><div class="v">${parcel.riskler.deprem} / ${parcel.riskler.sel}</div></div>
      <div class="card"><div class="k">Heyelan / Yangın</div><div class="v">${parcel.riskler.heyelan} / ${parcel.riskler.yangin}</div></div>
      <div class="card"><div class="k">Metro Mesafesi</div><div class="v">${Math.round(parcel.cevre.metroM)} m</div></div>
      <div class="card"><div class="k">Ulaşım Skoru</div><div class="v">${Math.round(parcel.cevre.ulasimSkoru)}/100</div></div>
    </div>
    <h2>Plan Notları</h2>
    <div class="card">
      <ul>${parcel.planNotlari.map((note) => `<li>${note}</li>`).join("")}</ul>
    </div>
  </body>
</html>`;
}
