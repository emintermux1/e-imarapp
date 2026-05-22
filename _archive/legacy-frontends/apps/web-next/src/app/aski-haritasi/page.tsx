import { PlatformShell } from "@/components/shell/PlatformShell";
import { DataCard } from "@/components/domain/Cards";

export default function AskiHaritasiPage() {
  return (
    <PlatformShell>
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold">Askı Haritası</h1>
        <div className="grid gap-3 md:grid-cols-3">
          <DataCard title="Tarih Filtresi">Başlangıç / Bitiş tarih aralığı</DataCard>
          <DataCard title="Belediye">İl / İlçe / Belediye bazlı filtreleme</DataCard>
          <DataCard title="Plan Türü">NIP / UIP / Revizyon / Askı süreci</DataCard>
        </div>
      </section>
    </PlatformShell>
  );
}
