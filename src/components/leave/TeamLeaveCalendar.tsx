'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { LeaveRequest } from '@/lib/types/database'

export function TeamLeaveCalendar({ approvedLeaves }: { approvedLeaves: LeaveRequest[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())

  // Calculate grid
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() // 0-indexed
  
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay() // 0 = Sunday
  
  const days = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i))
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const today = () => setCurrentDate(new Date())

  // Colors for employees
  const colors = [
    'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  ]
  
  // Assign a color to each unique employee
  const employeeColors: Record<string, string> = {}
  let colorIndex = 0
  approvedLeaves.forEach(req => {
    if (req.employee_id && !employeeColors[req.employee_id]) {
      employeeColors[req.employee_id] = colors[colorIndex % colors.length]
      colorIndex++
    }
  })

  // Helper to check if a request covers a specific date
  const getLeavesForDate = (date: Date) => {
    // Normalize date to 00:00:00 local time string for safe comparison
    const dString = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0]
    
    return approvedLeaves.filter(req => {
      return req.start_date <= dString && req.end_date >= dString
    })
  }

  return (
    <div className="geo-card !p-0 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-[#1E293B] flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-lg font-semibold text-white">Team Leave Calendar</h2>
        
        <div className="flex items-center gap-4 bg-[#0F172A] p-1.5 rounded-lg border border-[#1E293B]">
          <button onClick={prevMonth} className="p-1 hover:bg-[#1E293B] rounded-md transition-colors text-slate-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="w-32 text-center font-semibold text-slate-300 cursor-pointer hover:text-white transition-colors" onClick={today}>
            {currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </div>
          
          <button onClick={nextMonth} className="p-1 hover:bg-[#1E293B] rounded-md transition-colors text-slate-400 hover:text-white">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-[#1E293B] bg-[#1E293B]/20">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 bg-[#0F172A]">
        {days.map((date, i) => {
          if (!date) {
            return <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-[#1E293B]/50 bg-[#0F172A]/50"></div>
          }

          const leaves = getLeavesForDate(date)
          const isToday = new Date().toDateString() === date.toDateString()

          return (
            <div key={date.toISOString()} className={`min-h-[120px] border-b border-r border-[#1E293B]/50 p-2 transition-colors hover:bg-[#1E293B]/20 ${isToday ? 'bg-accent/5' : ''}`}>
              <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-2 ${
                isToday ? 'bg-accent text-white' : 'text-slate-400'
              }`}>
                {date.getDate()}
              </div>
              
              <div className="space-y-1.5">
                {leaves.map(l => (
                  <div 
                    key={l.id} 
                    className={`text-[10px] sm:text-xs truncate px-1.5 py-1 rounded border ${employeeColors[l.employee_id]} cursor-default`}
                    title={`${l.employee?.full_name} - ${l.leave_type?.name}`}
                  >
                    <span className="hidden sm:inline">{l.employee?.full_name.split(' ')[0]}</span>
                    <span className="sm:hidden">
                      {l.employee?.full_name.charAt(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
