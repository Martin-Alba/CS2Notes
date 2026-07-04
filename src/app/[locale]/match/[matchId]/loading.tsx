import { Skeleton } from "@/components/skeleton";

export default function MatchDetailLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="mb-2 h-4 w-16" />
        <Skeleton className="mb-1 h-8 w-72" />
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card rounded-lg p-4">
            <Skeleton className="mb-3 h-5 w-32" />
            <Skeleton className="h-16 w-full rounded-md" />
            <Skeleton className="mt-3 h-8 w-full rounded-lg" />
          </div>
        ))}
      </div>

      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  );
}
