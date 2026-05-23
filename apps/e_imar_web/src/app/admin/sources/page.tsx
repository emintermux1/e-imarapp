import Link from "next/link";
import { AdminMetric, AdminShell, AdminSourceLabel, AdminTable } from "@/components/admin/admin-shell";
import { sourceSummary } from "@/components/admin/admin-data";
import { FALLBACK_SOURCES } from "@/data/generated/source-fixtures";
import { StatusBanner } from "@/components/product/status-banner";
import type { DataSourceStatus } from "@/types/api";

export default function AdminSourcesPage() {
  const sources = FALLBACK_SOURCES.slice(0, 18);

  return (
    <AdminShell title="Sources" eyebrow="Admin / sources">
      <div className="grid gap-3 md:grid-cols-4">
        <AdminMetric label="Toplam" value={String(sourceSummary.total)} detail="Registry kaydı" />
        <AdminMetric label="Public" value={String(sourceSummary.officialish)} detail="Açık erişim/public portal" tone="good" />
        <AdminMetric label="Korumalı" value={String(sourceSummary.protected)} detail="Credential/legal/captcha bekler" tone="warn" />
        <AdminMetric label="Belediye" value={String(sourceSummary.municipal)} detail="Municipal GIS sınıfı" />
      </div>
      <div className="mt-4"><StatusBanner compact /></div>
      <AdminTable title="Kaynak registry" description="Registry kaydı canlı endpoint anlamına gelmez; public, korumalı ve canlı doğrulama etiketleri ayrı tutulur." state={sources.length > 0 ? "ready" : "empty"}>
        <table className="admin-responsive-table w-full text-left text-sm">
          <thead className="bg-surface-2 text-[10px] uppercase tracking-[0.18em] text-fg-muted">
            <tr><th className="p-3">Kaynak</th><th>Kategori</th><th>Auth</th><th>Etiket</th><th>Provider</th><th>Link</th></tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.id} className="border-t border-border-subtle">
                <td data-label="Kaynak" className="p-3"><div className="font-black text-fg-primary">{source.name}</div><div className="max-w-xl text-xs leading-relaxed text-fg-muted md:truncate">{source.notes}</div></td>
                <td data-label="Kategori">{source.category}</td>
                <td data-label="Auth"><span className="rounded-full bg-surface-2 px-2 py-1 text-xs font-bold">{source.auth}</span></td>
                <td data-label="Etiket"><AdminSourceLabel status={sourceStatusForAuth(source.auth)} label={source.auth === "public" ? "Registry public" : source.auth.includes("requires") ? "Korumalı" : "Metadata"} /></td>
                <td data-label="Provider">{source.provider}</td>
                <td data-label="Link">{source.base_url ? <Link className="font-bold text-brand-blue hover:underline" href={source.base_url}>Aç</Link> : <span className="text-fg-muted">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTable>
    </AdminShell>
  );
}

function sourceStatusForAuth(auth: string): DataSourceStatus {
  if (auth === "public") return "public_metadata";
  if (auth.includes("requires")) return "not_ready";
  return "demo";
}
