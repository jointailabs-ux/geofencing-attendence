import { Skeleton } from '@/components/ui/skeleton'

export default function StaffGenericLoading() {
  return (
    <div className="p-4 sm:p-8 max-w-lg mx-auto space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <Skeleton className="h-8 w-48 mx-auto sm:mx-0" />
        <Skeleton className="h-4 w-32 mx-auto sm:mx-0" />
      </div>

      <div className="geo-card space-y-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center py-3 border-b border-[#1E293B]/50 last:border-0">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
