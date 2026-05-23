import { dehydrate, QueryClient } from '@tanstack/react-query';
import { getBootstrap, getMapProviders } from '@/lib/api/client';
import { queryKeys } from './keys';
import type { ApiFailure, BootstrapResponse, MapProvider } from '@/lib/api/types';

/**
 * Build a fresh server-side QueryClient and prefetch the data the workspace
 * needs to first paint. We swallow API errors here on purpose — the client
 * components will retry/render readiness states based on their own status.
 */
export async function prefetchBootstrap(userReference?: string) {
  const queryClient = new QueryClient();
  await Promise.all([
    queryClient
      .prefetchQuery<BootstrapResponse, ApiFailure>({
        queryKey: queryKeys.bootstrap(userReference),
        queryFn: async () => {
          const result = await getBootstrap(userReference);
          if (!result.ok) throw result.error;
          return result.data;
        },
        staleTime: 5 * 60_000,
      })
      .catch(() => undefined),
    queryClient
      .prefetchQuery<MapProvider[], ApiFailure>({
        queryKey: queryKeys.mapProviders(),
        queryFn: async () => {
          const result = await getMapProviders();
          if (!result.ok) throw result.error;
          return result.data;
        },
        staleTime: 5 * 60_000,
      })
      .catch(() => undefined),
  ]);
  return dehydrate(queryClient);
}
