import { Building2, Users, IndianRupee, CalendarOff, Activity } from 'lucide-react'

export default function AdminDashboardLoading() {
  const stats = [
    { label: 'Total Employees', icon: Users },
    { label: 'Total Outlets', icon: Building2 },
    { label: "Today's Attendance", icon: Activity },
    { label: 'Pending Leaves', icon: CalendarOff },
    { label: 'Payroll Cost (MTD)', icon: IndianRupee },
  ]

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <div className="h-4 w-64 bg-[#334155] rounded animate-pulse mt-2"></div>
      </div>

      {/* Top Metrics Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map(({ label, icon: Icon }) => (
          <div key={label} className="geo-card !p-4 flex flex-col justify-between h-32">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#334155] animate-pulse">
              <Icon className="w-5 h-5 text-slate-500 opacity-50" />
            </div>
            <div>
              <div className="h-7 w-16 bg-[#334155] rounded animate-pulse mb-1"></div>
              <p className="text-xs font-medium text-slate-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          <div className="geo-card h-[400px] flex items-center justify-center">
             <div className="h-64 w-full bg-[#334155] rounded-xl animate-pulse opacity-20"></div>
          </div>
          <div className="geo-card h-64 flex items-center justify-center">
             <div className="h-48 w-full bg-[#334155] rounded-xl animate-pulse opacity-20"></div>
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-6">
          <div className="geo-card h-[688px] flex items-center justify-center">
             <div className="h-full w-full bg-[#334155] rounded-xl animate-pulse opacity-20"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
