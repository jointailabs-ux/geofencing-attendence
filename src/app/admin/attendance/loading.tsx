import { Skeleton } from '@/components/ui/skeleton'

export default function AdminAttendanceLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="page-header space-y-2">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="geo-card space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-full sm:w-44 rounded-lg" />
          <Skeleton className="h-10 w-full sm:w-36 rounded-lg" />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between border-b border-[#334155] pb-3 px-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center py-3 px-4 border-b border-[#1E293B] last:border-0">
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-12 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
