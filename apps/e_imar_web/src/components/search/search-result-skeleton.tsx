import { Skeleton } from "@/components/ui/skeleton";

export function SearchResultSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="py-1" aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="search-skeleton-row flex items-center gap-3 px-3 py-2.5"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <Skeleton className="h-6 w-6 shrink-0 rounded-sm" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-3.5 w-[58%] max-w-[280px]" />
            <Skeleton className="mt-1.5 h-3 w-[42%] max-w-[220px]" />
          </div>
        </div>
      ))}
    </div>
  );
}
