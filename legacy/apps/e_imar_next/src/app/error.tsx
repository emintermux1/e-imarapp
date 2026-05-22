'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { StatusBanner } from '@/components/data/StatusBanner';
import { useEffect } from 'react';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    if (typeof console !== 'undefined') {
      console.error('[app:error]', error);
    }
  }, [error]);
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-bg-base p-6">
      <div className="w-full max-w-xl space-y-4">
        <StatusBanner
          status="provider_error"
          title="Beklenmedik bir hata"
          message={error.message || 'Sayfa yüklenirken bir hata oluştu.'}
          nextActions={[
            'Sayfayı yeniden yüklemek için "Tekrar dene" düğmesini kullanın.',
            error.digest ? `Hata kimliği: ${error.digest}` : 'Sorun devam ederse Captain ekibine bildirin.',
          ]}
          onRetry={reset}
          retryLabel="Tekrar dene"
        />
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="secondary">Anasayfa</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
