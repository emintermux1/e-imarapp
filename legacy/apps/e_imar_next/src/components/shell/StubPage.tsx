'use client';

import { type ReactNode } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { ReadinessGate } from '@/components/data/ReadinessGate';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface StubPageProps {
  title: string;
  description: ReactNode;
  nextActions?: string[];
  showLeftSidebar?: boolean;
  showRightPanel?: boolean;
  showBottomSheet?: boolean;
}

export function StubPage({
  title,
  description,
  nextActions,
  showLeftSidebar = true,
  showRightPanel = false,
  showBottomSheet = false,
}: StubPageProps) {
  return (
    <AppShell
      showLeftSidebar={showLeftSidebar}
      showRightPanel={showRightPanel}
      showBottomSheet={showBottomSheet}
    >
      <div className="grid h-full place-items-center bg-bg-base px-4 py-10">
        <div className="w-full max-w-xl space-y-4">
          <ReadinessGate
            status="not_ready"
            notReadyTitle={title}
            notReadyDescription={
              typeof description === 'string' ? description : undefined
            }
            nextActions={nextActions}
          >
            <div />
          </ReadinessGate>
          {typeof description !== 'string' ? (
            <div className="rounded-lg border border-border-subtle bg-bg-surface p-4 text-[13px] text-text-secondary">
              {description}
            </div>
          ) : null}
          <div>
            <Link href="/" className="inline-flex">
              <Button
                variant="secondary"
                leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden />}
              >
                Harita çalışma alanına dön
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
