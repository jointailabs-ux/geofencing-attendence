import { Skeleton } from '@/components/ui/skeleton'

export default function AdminEmployeesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-full sm:w-44 rounded-lg" />
        <Skeleton className="h-10 w-full sm:w-36 rounded-lg" />
        <Skeleton className="h-10 w-full sm:w-36 rounded-lg" />
      </div>

      <div className="geo-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-full align-middle">
            <div className="bg-[#0F172A]/40 h-10 border-b border-[#334155] flex items-center px-4 justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 border-b border-[#1E293B] flex items-center px-4 justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
