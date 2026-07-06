import { Skeleton } from '@/components/ui/skeleton'

export default function StaffLoading() {
  return (
    <div className="p-4 sm:p-8 max-w-lg mx-auto space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <Skeleton className="h-8 w-48 mx-auto sm:mx-0" />
        <Skeleton className="h-4 w-32 mx-auto sm:mx-0" />
      </div>

      <Skeleton className="h-[280px] w-full rounded-2xl" />

      <div className="grid grid-cols-2 gap-4">
        <div className="geo-card !p-4 h-32 flex flex-col justify-between">
          <Skeleton className="w-24 h-4" />
          <div className="flex justify-between items-end">
            <div className="space-y-1"><Skeleton className="h-8 w-12" /><Skeleton className="h-3 w-16" /></div>
            <div className="space-y-1 flex flex-col items-end"><Skeleton className="h-6 w-8" /><Skeleton className="h-3 w-16" /></div>
          </div>
        </div>
        <div className="geo-card !p-4 h-32 flex flex-col justify-between">
          <Skeleton className="w-24 h-4" />
          <div className="space-y-1">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>

      <div className="geo-card h-[200px]">
        <Skeleton className="h-4 w-32 mb-6" />
        <div className="space-y-4">
          <div className="flex justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-12" /></div>
          <div className="flex justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-12" /></div>
          <div className="flex justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-12" /></div>
        </div>
      </div>
    </div>
  )
}
