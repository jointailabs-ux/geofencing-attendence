import { LeaveBalance } from '@/lib/types/database'

export function LeaveBalanceCards({ balances }: { balances: LeaveBalance[] }) {
  if (!balances || balances.length === 0) {
    return (
      <div className="geo-card text-center text-slate-400 py-6 text-sm">
        No leave balances found for this year.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {balances.map((b) => {
        const type = b.leave_type
        const allocated = b.allocated_days
        const used = Number(b.used_days)
        const remaining = allocated > 0 ? allocated - used : 0
        const progress = allocated > 0 ? (used / allocated) * 100 : 0
        
        return (
          <div key={b.id} className="geo-card !p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <span className="font-semibold text-white text-sm">{type?.name}</span>
              {!type?.is_paid && (
                <span className="text-[10px] bg-[#1E293B] text-slate-400 px-1.5 py-0.5 rounded border border-[#334155]">
                  Unpaid
                </span>
              )}
            </div>

            {type?.annual_allocation_days === 0 ? (
              <div className="mt-auto pt-2 border-t border-[#1E293B]">
                <div className="text-2xl font-bold text-slate-300">{used}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Days Used</div>
              </div>
            ) : (
              <div className="mt-auto">
                <div className="flex items-end gap-1 mb-2">
                  <div className={`text-2xl font-bold ${remaining < 0 ? 'text-danger' : 'text-accent'}`}>
                    {remaining < 0 ? 0 : remaining}
                  </div>
                  <div className="text-sm text-slate-500 mb-1 font-medium">/ {allocated} left</div>
                </div>

                <div className="h-1.5 w-full bg-[#1E293B] rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${progress > 90 ? 'bg-danger' : progress > 70 ? 'bg-warning' : 'bg-accent'}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                
                {remaining < 0 && (
                  <p className="text-[10px] text-danger mt-1">Exceeded by {Math.abs(remaining)} days</p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
