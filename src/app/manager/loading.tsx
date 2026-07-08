import { Skeleton } from '@/components/ui/skeleton'

export default function ManagerGenericLoading() {
  return (
    <div className="space-y-6">
      <div className="page-header space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-60" />
      </div>

      {/* Generic Table or Grid Loading Skeleton */}
      <div className="geo-card space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-full sm:w-36 rounded-lg" />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between border-b border-[#334155] pb-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-[#1E293B]/50 last:border-0">
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
