import { StubPage } from '@/components/shell/StubPage';

export const metadata = {
  title: 'Time Machine',
};

export default function TimeMachinePage() {
  return (
    <StubPage
      title="Time Machine — Sprint 3"
      description="Plan değişimi tarihçesi ve karşılaştırma görünümü Sprint 3'te yayınlanacak. Zaman çubuğu ve diff görünümü için backend snapshot servisi tamamlanmalı."
      nextActions={[
        'Sprint 3: plan revizyonları snapshot servisi',
        'Sprint 3: parsel/ada bazlı zaman çubuğu',
        'Sprint 3: yan yana karşılaştırma',
      ]}
    />
  );
}
