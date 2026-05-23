import { StubPage } from '@/components/shell/StubPage';

export const metadata = {
  title: 'Parsel Alarm',
};

export default function WatchlistPage() {
  return (
    <StubPage
      title="Parsel Alarm — Sprint 2"
      description="Bu modül sonraki sprintte aktif edilecek. Parsel Alarm kuralları, bildirim tercihleri ve abonelik akışı backend bağlantısı tamamlandığında burada listelenecek."
      nextActions={[
        'Sprint 2: /eplan/subscriptions ile Parsel Alarm kuralı oluşturma',
        'Sprint 2: kullanıcı bazlı favori parsel yönetimi',
        'Sprint 2: e-posta ve push gateway bağlantısı',
      ]}
    />
  );
}
