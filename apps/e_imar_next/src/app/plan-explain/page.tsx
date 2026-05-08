import { Suspense } from 'react';
import { HydrationBoundary } from '@tanstack/react-query';
import { AppShell } from '@/components/shell/AppShell';
import { PlanExplainShell } from '@/components/explain/PlanExplainShell';
import { prefetchBootstrap } from '@/lib/query/server';

export const metadata = {
  title: 'Plan Açıklayıcı',
};

export default async function PlanExplainPage() {
  const dehydratedState = await prefetchBootstrap();
  return (
    <HydrationBoundary state={dehydratedState}>
      <AppShell showLeftSidebar={false} showRightPanel={false} showBottomSheet={false}>
        <Suspense fallback={null}>
          <PlanExplainShell />
        </Suspense>
      </AppShell>
    </HydrationBoundary>
  );
}
