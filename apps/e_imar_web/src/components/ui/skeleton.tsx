import * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "shimmer-overlay rounded-sm bg-surface-1 border border-border-subtle/60",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}
