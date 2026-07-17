'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function QuestTrackerSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );
}
