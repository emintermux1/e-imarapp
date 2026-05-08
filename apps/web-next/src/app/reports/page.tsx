import { PlatformShell } from "@/components/shell/PlatformShell";
import { DataCard } from "@/components/domain/Cards";

export default function ReportsPage() {
  return (
    <PlatformShell>
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold">Rapor Merkezi</h1>
        <div className="grid gap-3 md:grid-cols-2">
          <DataCard title="PDF Raporlar">Parsel bazlı analiz raporları, paylaşım ve indirilebilir çıktı.</DataCard>
          <DataCard title="Durum Takibi">Queued / running / completed / failed durumları.</DataCard>
        </div>
      </section>
    </PlatformShell>
  );
}
