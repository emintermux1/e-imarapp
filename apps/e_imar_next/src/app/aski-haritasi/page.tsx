import { prefetchBootstrap } from '@/lib/query/server';
import { AskiHaritasiClient } from './AskiHaritasiClient';

export const metadata = {
  title: 'Askı Haritası',
};

export default async function AskiHaritasiPage() {
  const dehydratedState = await prefetchBootstrap();
  return <AskiHaritasiClient dehydratedState={dehydratedState} />;
}
