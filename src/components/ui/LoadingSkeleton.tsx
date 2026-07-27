"use client";

import { cn } from "@/lib/utils";

type SkeletonBaseProps = React.HTMLAttributes<HTMLDivElement>;

function SkeletonBase({ className, ...props }: SkeletonBaseProps) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-surface-warm", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export function CardSkeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn("p-5 rounded-2xl border border-border shadow-soft bg-surface", className)} style={style}>
      <SkeletonBase className="w-10 h-10 rounded-xl mb-3" />
      <SkeletonBase className="h-6 w-20 mb-2" />
      <SkeletonBase className="h-4 w-32" />
    </div>
  );
}

export function ListItemSkeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-xl bg-surface", className)} style={style}>
      <SkeletonBase className="w-5 h-5 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBase className="h-4 w-3/4" />
        <SkeletonBase className="h-3 w-1/4" />
      </div>
    </div>
  );
}

export function ImageGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBase key={i} className="w-full rounded-2xl" style={{ aspectRatio: 1 }} />
      ))}
    </div>
  );
}
