import { Users, CalendarOff, Activity } from 'lucide-react'

export default function ManagerDashboardLoading() {
  const stats = [
    { label: 'Total Staff', icon: Users },
    { label: 'Present Today', icon: Activity },
    { label: 'Pending Leaves', icon: CalendarOff },
  ]

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <h1 className="page-title">Outlet Dashboard</h1>
        <div className="h-4 w-48 bg-[#334155] rounded animate-pulse mt-2"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map(({ label, icon: Icon }) => (
          <div key={label} className="geo-card !p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#334155] animate-pulse">
              <Icon className="w-6 h-6 text-slate-500 opacity-50" />
            </div>
            <div>
              <div className="h-8 w-12 bg-[#334155] rounded animate-pulse mb-1"></div>
              <p className="text-xs font-medium text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="geo-card !p-0 overflow-hidden">
        <div className="p-5 border-b border-[#1E293B]">
          <h2 className="text-lg font-bold text-white">Today&apos;s Roster</h2>
        </div>
        <div className="p-8 flex items-center justify-center">
            <div className="h-64 w-full bg-[#334155] rounded-xl animate-pulse opacity-20"></div>
        </div>
      </div>
    </div>
  )
}
