import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/data/EmptyState';
import { Compass } from 'lucide-react';

export const metadata = {
  title: 'Sayfa bulunamadı',
};

export default function NotFound() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-bg-base p-6">
      <EmptyState
        title="Aradığınız sayfa bulunamadı"
        description="Bağlantı taşınmış veya hiç oluşturulmamış olabilir. Harita çalışma alanına dönerek devam edin."
        icon={<Compass className="h-6 w-6" aria-hidden />}
        action={
          <Link href="/">
            <Button variant="primary">Anasayfaya dön</Button>
          </Link>
        }
      />
    </div>
  );
}
