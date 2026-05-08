import { HydrationBoundary } from '@tanstack/react-query';
import { AppShell } from '@/components/shell/AppShell';
import { MapViewport } from '@/components/map/MapViewport';
import { prefetchBootstrap } from '@/lib/query/server';
import { SelectParcelOnMount } from './SelectParcelOnMount';

interface ParcelPageProps {
  params: { id: string };
}

export default async function ParcelPage({ params }: ParcelPageProps) {
  const dehydratedState = await prefetchBootstrap();
  return (
    <HydrationBoundary state={dehydratedState}>
      <SelectParcelOnMount id={params.id} />
      <AppShell>
        <MapViewport className="h-full w-full" />
      </AppShell>
    </HydrationBoundary>
  );
}

export function generateMetadata({ params }: ParcelPageProps) {
  return {
    title: `Parsel ${params.id}`,
  };
}
