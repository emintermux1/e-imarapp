import { HydrationBoundary } from '@tanstack/react-query';
import { AppShell } from '@/components/shell/AppShell';
import { MapViewport } from '@/components/map/MapViewport';
import { prefetchBootstrap } from '@/lib/query/server';

export default async function HomePage() {
  const dehydratedState = await prefetchBootstrap();
  return (
    <HydrationBoundary state={dehydratedState}>
      <AppShell>
        <MapViewport className="h-full w-full" />
      </AppShell>
    </HydrationBoundary>
  );
}
