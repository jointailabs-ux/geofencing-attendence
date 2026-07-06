'use client'

import { useState } from 'react'
import { addHoliday, deleteHoliday } from '@/app/actions/settings'
import { Trash2, Plus, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Holiday } from '@/lib/types/database'

export function HolidaysManager({ orgId, initialHolidays }: { orgId: string, initialHolidays: Holiday[] }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [date, setDate] = useState('')
  const [name, setName] = useState('')

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !name) return

    setIsSubmitting(true)
    try {
      await addHoliday(orgId, date, name)
      toast.success('Holiday added')
      setDate('')
      setName('')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add holiday')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this holiday?')) return
    try {
      await deleteHoliday(id)
      toast.success('Holiday removed')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to remove holiday')
    }
  }

  const currentYear = new Date().getFullYear()
  const thisYearHolidays = initialHolidays.filter(h => h.date.startsWith(currentYear.toString()))

  return (
    <div className="geo-card !p-0 overflow-hidden">
      <div className="p-6 border-b border-[#1E293B] bg-[#0F172A]">
        <h2 className="text-lg font-semibold text-white mb-1">Organization Holidays</h2>
        <p className="text-sm text-slate-400">Manage holidays. These days will not be counted as unexcused absences during payroll calculations.</p>
      </div>

      <div className="p-6 border-b border-[#1E293B]">
        <form onSubmit={handleAdd} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Holiday Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Diwali, Christmas"
              className="w-full bg-[#0F172A] border border-[#1E293B] rounded-xl px-4 py-2.5 text-white focus:border-accent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Date</label>
            <input 
              type="date" 
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-[#0F172A] border border-[#1E293B] rounded-xl px-4 py-2.5 text-white focus:border-accent text-sm [color-scheme:dark]"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 h-[46px]"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>
      </div>

      <div className="p-6">
        <h3 className="text-sm font-medium text-slate-400 mb-4">{currentYear} Holidays ({thisYearHolidays.length})</h3>
        
        {thisYearHolidays.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-[#0F172A] rounded-xl border border-dashed border-[#1E293B]">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No holidays configured for this year.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {thisYearHolidays.map(h => (
              <div key={h.id} className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-3 flex justify-between items-center group">
                <div>
                  <p className="text-sm font-semibold text-white">{h.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(h.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(h.id)}
                  className="text-slate-500 hover:text-danger p-1.5 rounded-lg hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove holiday"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
