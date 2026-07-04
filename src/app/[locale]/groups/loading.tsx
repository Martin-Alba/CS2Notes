import { Skeleton } from "@/components/skeleton";

export default function GroupsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-28" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-3/4 rounded-lg" />
      </div>
    </div>
  );
}
