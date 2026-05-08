import { HydrationBoundary } from '@tanstack/react-query';
import { AppShell } from '@/components/shell/AppShell';
import { TimemachineShell } from '@/components/timemachine/TimemachineShell';
import { prefetchBootstrap } from '@/lib/query/server';

export const metadata = {
  title: 'Time Machine',
};

export default async function TimeMachinePage() {
  const dehydratedState = await prefetchBootstrap();
  return (
    <HydrationBoundary state={dehydratedState}>
      <AppShell showLeftSidebar={false} showRightPanel={false} showBottomSheet={false}>
        <TimemachineShell />
      </AppShell>
    </HydrationBoundary>
  );
}
