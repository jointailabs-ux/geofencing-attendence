'use client'

import { useState } from 'react'
import { adminResetPassword } from '@/app/actions/auth'
import { toast } from 'sonner'
import { Shield, Loader2, KeyRound, Check } from 'lucide-react'

export function ManagePinsTable({ employees }: { employees: any[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newPin, setNewPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSave(employeeId: string) {
    if (newPin.length !== 6) {
      toast.error('PIN must be exactly 6 digits')
      return
    }
    if (!/^\d+$/.test(newPin)) {
      toast.error('PIN must contain only numbers')
      return
    }

    setIsLoading(true)
    const result = await adminResetPassword(employeeId, newPin)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('PIN successfully updated')
      setEditingId(null)
      setNewPin('')
    }
    setIsLoading(false)
  }

  return (
    <div className="geo-card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="text-xs uppercase bg-[#182136] text-slate-400 border-b border-[#2A3650]">
            <tr>
              <th className="px-6 py-4 font-semibold">Employee</th>
              <th className="px-6 py-4 font-semibold">ID & Role</th>
              <th className="px-6 py-4 font-semibold">Current PIN</th>
              <th className="px-6 py-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A3650]">
            {employees.map((employee) => (
              <tr key={employee.id} className="hover:bg-[#182136]/50 transition-colors">
                <td className="px-6 py-4 font-medium text-white">
                  {employee.full_name}
                </td>
                <td className="px-6 py-4">
                  <span className="block text-white">{employee.employee_code}</span>
                  <span className="text-xs text-slate-500 capitalize">{employee.role.replace('_', ' ')}</span>
                </td>
                <td className="px-6 py-4">
                  {editingId === employee.id ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="6-Digit PIN"
                      className="field-input px-3 py-1.5 text-sm w-32 tracking-widest font-mono text-center"
                      autoFocus
                    />
                  ) : (
                    <span className="font-mono tracking-widest text-slate-400">••••••</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {editingId === employee.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleSave(employee.id)}
                        disabled={isLoading}
                        className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-md transition-colors disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setNewPin(''); }}
                        disabled={isLoading}
                        className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingId(employee.id); setNewPin(''); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-accent/10 text-accent hover:bg-accent/20 rounded-lg transition-colors border border-accent/20"
                    >
                      <KeyRound className="w-3 h-3" />
                      Reset PIN
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
