import { SkeletonCard } from '@/components/data/Skeleton';

export default function Loading() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-bg-base p-6">
      <div className="w-full max-w-md space-y-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
