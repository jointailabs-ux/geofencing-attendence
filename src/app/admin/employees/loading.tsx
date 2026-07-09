export default function EmployeesLoading() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Employees</h1>
          <div className="h-4 w-32 bg-[#334155] rounded animate-pulse mt-2"></div>
        </div>
        <div className="h-10 w-32 bg-[#334155] rounded-lg animate-pulse"></div>
      </div>

      <div className="geo-card !p-0 overflow-hidden">
        <div className="p-4 border-b border-[#1E293B] flex justify-between">
            <div className="h-8 w-64 bg-[#334155] rounded animate-pulse"></div>
            <div className="h-8 w-24 bg-[#334155] rounded animate-pulse"></div>
        </div>
        <div className="p-8">
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-12 w-full bg-[#334155] rounded animate-pulse opacity-20"></div>
                ))}
            </div>
        </div>
      </div>
    </div>
  )
}
