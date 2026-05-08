import { StubPage } from '@/components/shell/StubPage';

export const metadata = {
  title: 'Watchlist',
};

export default function WatchlistPage() {
  return (
    <StubPage
      title="Watchlist — Sprint 2"
      description="Bu modül sonraki sprintte aktif edilecek. Watchlist CRUD, bildirim kuralları ve abonelik akışı backend bağlantısı tamamlandığında burada listelenecek."
      nextActions={[
        'Sprint 2: /eplan/subscriptions ile bildirim kuralı oluşturma',
        'Sprint 2: kullanıcı bazlı favori parsel yönetimi',
        'Sprint 2: e-posta ve push gateway bağlantısı',
      ]}
    />
  );
}
