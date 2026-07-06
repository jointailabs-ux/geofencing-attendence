import { Skeleton } from '@/components/ui/skeleton'

export default function ManagerLoading() {
  return (
    <div className="space-y-6">
      <div className="page-header space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="geo-card !p-4 h-32 flex flex-col justify-between">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="geo-card h-[500px]">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="geo-card h-[250px]">
            <Skeleton className="h-4 w-32 mb-6" />
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
