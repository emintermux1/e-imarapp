import { StubPage } from '@/components/shell/StubPage';

export const metadata = {
  title: 'Raporlar',
};

export default function ReportsPage() {
  return (
    <StubPage
      title="Raporlar — Sprint 2"
      description="PDF rapor üretimi, parsel demet karşılaştırması ve ihracat akışı Sprint 2'de aktive edilecek."
      nextActions={[
        'Sprint 2: parsel detay PDF rapor şablonu',
        'Sprint 2: emsal/pay analizi PDF eki',
        'Sprint 2: GeoJSON / CSV ihracat',
      ]}
    />
  );
}
