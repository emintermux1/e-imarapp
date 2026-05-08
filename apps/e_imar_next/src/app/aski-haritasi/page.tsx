import { StubPage } from '@/components/shell/StubPage';

export const metadata = {
  title: 'Askı Haritası',
};

export default function AskiHaritasiPage() {
  return (
    <StubPage
      title="Askı haritası — Sprint 2"
      description="Belediyelerin askıya çıkardığı plan değişikliklerinin haritada gerçek zamanlı görüntülenmesi Sprint 2'de aktive edilecek."
      nextActions={[
        'Sprint 2: askı kataloğu ingestion pipeline',
        'Sprint 2: askı süresi ve itiraz son tarihi gösterimi',
      ]}
    />
  );
}
