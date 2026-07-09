import { Clock, CalendarOff } from 'lucide-react'

export default function StaffDashboardLoading() {
  const stats = [
    { label: 'Present Days (MTD)', icon: Clock },
    { label: 'Leaves Taken', icon: CalendarOff },
  ]

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title text-2xl">Dashboard</h1>
        <div className="h-4 w-48 bg-[#334155] rounded animate-pulse mt-2"></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map(({ label, icon: Icon }) => (
          <div key={label} className="geo-card !p-4 flex flex-col justify-between h-32">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#334155] animate-pulse">
              <Icon className="w-5 h-5 text-slate-500 opacity-50" />
            </div>
            <div>
              <div className="h-7 w-12 bg-[#334155] rounded animate-pulse mb-1"></div>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5 uppercase tracking-wider">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="h-[400px] bg-[#1E293B] border border-[#334155] rounded-2xl flex items-center justify-center animate-pulse">
        <div className="w-48 h-48 rounded-full border-[10px] border-[#334155]/50 flex items-center justify-center">
            <div className="w-16 h-16 bg-[#334155] rounded-full"></div>
        </div>
      </div>
    </div>
  )
}
