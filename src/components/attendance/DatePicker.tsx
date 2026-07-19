'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'

export function DatePicker() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentDateParam = searchParams.get('date')
  
  // Default to today in local timezone
  const today = new Date()
  // Adjust to local timezone string (YYYY-MM-DD)
  const offset = today.getTimezoneOffset()
  const todayStr = new Date(today.getTime() - (offset*60*1000)).toISOString().split('T')[0]
  
  const selectedDate = currentDateParam || todayStr

  const handleDateChange = (date: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('date', date)
    router.push(`?${params.toString()}`)
  }

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + days)
    const newStr = new Date(d.getTime() - (d.getTimezoneOffset()*60*1000)).toISOString().split('T')[0]
    handleDateChange(newStr)
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/[0.02] border border-white/10 p-3 rounded-2xl backdrop-blur-xl shadow-xl w-full sm:w-auto">
      
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
        <button 
          onClick={() => shiftDate(-1)}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/5"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="relative group">
          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 pointer-events-none group-focus-within:text-emerald-300" />
          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none cursor-pointer"
            style={{ colorScheme: 'dark' }}
          />
        </div>

        <button 
          onClick={() => shiftDate(1)}
          disabled={selectedDate >= todayStr}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/5 disabled:opacity-30 disabled:hover:bg-white/5 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="hidden sm:block w-[1px] h-8 bg-white/10 mx-1"></div>

      <button 
        onClick={() => handleDateChange(todayStr)}
        className={`w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-bold transition-colors border ${
          selectedDate === todayStr 
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
            : 'bg-white/5 text-slate-300 hover:bg-white/10 border-white/5'
        }`}
      >
        Today
      </button>
    </div>
  )
}
