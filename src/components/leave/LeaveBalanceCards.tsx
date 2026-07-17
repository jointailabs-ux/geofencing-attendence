import { LeaveBalance } from '@/lib/types/database'

const leaveColors = [
  { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', gradient: 'linear-gradient(90deg, #8B5CF6, #a78bfa)' },
  { color: '#06B6D4', bg: 'rgba(6,182,212,0.12)', gradient: 'linear-gradient(90deg, #06B6D4, #67e8f9)' },
  { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', gradient: 'linear-gradient(90deg, #F59E0B, #fbbf24)' },
  { color: '#F43F5E', bg: 'rgba(244,63,94,0.12)', gradient: 'linear-gradient(90deg, #F43F5E, #fb7185)' },
  { color: '#10B981', bg: 'rgba(16,185,129,0.12)', gradient: 'linear-gradient(90deg, #10B981, #34d399)' },
]

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
      {balances.map((b, idx) => {
        const type = b.leave_type
        const allocated = b.allocated_days
        const used = Number(b.used_days)
        const remaining = allocated > 0 ? allocated - used : 0
        const progress = allocated > 0 ? (used / allocated) * 100 : 0
        const colorSet = leaveColors[idx % leaveColors.length]
        
        // Use danger colors when progress is high
        const barGradient = progress > 90
          ? 'linear-gradient(90deg, #EF4444, #f87171)'
          : progress > 70
          ? 'linear-gradient(90deg, #F59E0B, #fbbf24)'
          : colorSet.gradient
        
        return (
          <div key={b.id} className="rounded-2xl p-4 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(145deg, ${colorSet.bg}, rgba(10,15,30,0.9))`,
              border: `1px solid ${colorSet.color}20`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.2)`,
            }}>
            <div className="flex items-start justify-between">
              <span className="font-semibold text-white text-sm">{type?.name}</span>
              {!type?.is_paid && (
                <span className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{
                    background: 'rgba(100,116,139,0.12)',
                    color: '#94a3b8',
                    border: '1px solid rgba(100,116,139,0.15)',
                  }}>
                  Unpaid
                </span>
              )}
            </div>

            {type?.annual_allocation_days === 0 ? (
              <div className="mt-auto pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="text-2xl font-bold text-slate-300">{used}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Days Used</div>
              </div>
            ) : (
              <div className="mt-auto">
                <div className="flex items-end gap-1 mb-2">
                  <div className="text-2xl font-bold" style={{ color: remaining < 0 ? '#f87171' : colorSet.color }}>
                    {remaining < 0 ? 0 : remaining}
                  </div>
                  <div className="text-sm text-slate-500 mb-1 font-medium">/ {allocated} left</div>
                </div>

                <div className="h-1.5 w-full rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(progress, 100)}%`,
                      background: barGradient,
                      boxShadow: `0 0 8px ${colorSet.color}40`,
                    }}
                  />
                </div>
                
                {remaining < 0 && (
                  <p className="text-[10px] mt-1" style={{ color: '#f87171' }}>Exceeded by {Math.abs(remaining)} days</p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
