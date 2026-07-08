import { Skeleton } from '@/components/ui/skeleton'

export default function AdminLeaveLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="page-header space-y-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Approvals inbox section */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-56" />
        <div className="geo-card space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex justify-between items-center py-3 border-b border-[#1E293B] last:border-0">
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16 rounded-lg" />
                <Skeleton className="h-8 w-16 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar section */}
      <div className="geo-card !p-0 overflow-hidden space-y-4">
        <div className="p-6 border-b border-[#1E293B] flex justify-between items-center">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        
        {/* Days of week */}
        <div className="grid grid-cols-7 border-b border-[#1E293B] bg-[#1E293B]/20 py-3">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <Skeleton key={i} className="h-4 w-12 mx-auto" />
          ))}
        </div>

        {/* Calendar days grid */}
        <div className="grid grid-cols-7 bg-[#0F172A] gap-px">
          {Array.from({ length: 28 }).map((_, i) => (
            <div key={i} className="min-h-[100px] bg-[#0F172A] p-2 space-y-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
