import { StubPage } from '@/components/shell/StubPage';

export const metadata = {
  title: 'Ayarlar',
};

export default function SettingsPage() {
  return (
    <StubPage
      title="Ayarlar — Sprint 2"
      description="Profil, dil, harita varsayılanları ve sağlayıcı tercih ayarları Sprint 2'de eklenecek."
      nextActions={[
        'Sprint 2: kullanıcı profili',
        'Sprint 2: dil seçimi (TR/EN)',
        'Sprint 2: varsayılan harita stili ve katman tercihleri',
      ]}
    />
  );
}
