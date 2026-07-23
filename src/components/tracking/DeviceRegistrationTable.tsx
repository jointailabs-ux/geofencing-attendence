'use client'

import { useState } from 'react'
import { generateDeviceToken, deactivateDevice } from '@/app/actions/tracking'
import { toast } from 'sonner'
import { Copy, Smartphone, Trash2, RefreshCw, Zap, Eye, EyeOff } from 'lucide-react'

interface DeviceRegistration {
  id: string
  employee_id: string
  device_token: string
  device_name: string | null
  platform: string | null
  is_active: boolean
  last_seen_at: string | null
  created_at: string
  employee: {
    id: string
    full_name: string
    role: string
    email: string
    employee_code: string | null
    outlet_id: string | null
    outlets: { name: string } | null
  }
}

interface Employee {
  id: string
  full_name: string
  role: string
  email: string
  employee_code: string | null
}

interface DeviceRegistrationTableProps {
  devices: DeviceRegistration[]
  allEmployees: Employee[]
  appUrl: string
}

export function DeviceRegistrationTable({ devices, allEmployees, appUrl }: DeviceRegistrationTableProps) {
  const [generating, setGenerating] = useState<string | null>(null)
  const [deactivating, setDeactivating] = useState<string | null>(null)
  const [showTokens, setShowTokens] = useState<Set<string>>(new Set())

  // Employees without devices
  const registeredEmpIds = new Set(devices.map(d => d.employee_id))
  const unregistered = allEmployees.filter(e => !registeredEmpIds.has(e.id))

  const handleGenerate = async (employeeId: string) => {
    setGenerating(employeeId)
    try {
      const result = await generateDeviceToken(employeeId)
      toast.success(`Token generated: ${result.token}`)
    } catch {
      toast.error('Failed to generate token')
    } finally {
      setGenerating(null)
    }
  }

  const handleDeactivate = async (deviceId: string) => {
    if (!confirm('Remove this device? The employee will need a new token.')) return
    setDeactivating(deviceId)
    try {
      await deactivateDevice(deviceId)
      toast.success('Device removed')
    } catch {
      toast.error('Failed to remove device')
    } finally {
      setDeactivating(null)
    }
  }

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token)
    toast.success('Token copied to clipboard!')
  }

  const copySetupUrl = (token: string) => {
    const url = `${appUrl}/api/location-ping?token=${token}`
    navigator.clipboard.writeText(url)
    toast.success('Webhook URL copied!')
  }

  const toggleTokenVisibility = (id: string) => {
    setShowTokens(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function getTimeSince(dateStr: string | null) {
    if (!dateStr) return 'Never'
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ${mins % 60}m ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="space-y-6">
      {/* Registered Devices */}
      {devices.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-violet-400" />
              Registered Devices ({devices.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-white/5">
                  <th className="px-4 py-3 text-left font-medium">Employee</th>
                  <th className="px-4 py-3 text-left font-medium">Device Token</th>
                  <th className="px-4 py-3 text-left font-medium">Webhook URL</th>
                  <th className="px-4 py-3 text-left font-medium">Last Seen</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {devices.map(d => {
                  const emp = d.employee as unknown as { full_name: string; role: string; outlets?: { name: string } | null }
                  const isVisible = showTokens.has(d.id)
                  const isOnline = d.last_seen_at && (Date.now() - new Date(d.last_seen_at).getTime() < 10 * 60 * 1000)

                  return (
                    <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-white">{emp.full_name}</p>
                          <p className="text-[10px] text-slate-500">
                            {emp.outlets?.name || 'No outlet'} • {emp.role.replace('_', ' ')}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-slate-800 px-2 py-1 rounded font-mono text-emerald-400">
                            {isVisible ? d.device_token : '••••••••••••'}
                          </code>
                          <button onClick={() => toggleTokenVisibility(d.id)} className="text-slate-500 hover:text-white transition-colors">
                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => copyToken(d.device_token)} className="text-slate-500 hover:text-violet-400 transition-colors">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => copySetupUrl(d.device_token)}
                          className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors"
                        >
                          Copy Webhook URL
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`} />
                          <span className="text-xs text-slate-400">{getTimeSince(d.last_seen_at)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleGenerate(d.employee_id)}
                            disabled={generating === d.employee_id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                            title="Regenerate token"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${generating === d.employee_id ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleDeactivate(d.id)}
                            disabled={deactivating === d.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Remove device"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unregistered Employees */}
      {unregistered.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Employees Without Tracking ({unregistered.length})
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">
              Generate a device token to enable OwnTracks tracking for these employees.
            </p>
          </div>
          <div className="divide-y divide-white/5">
            {unregistered.map(emp => (
              <div key={emp.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
                <div>
                  <p className="text-sm font-medium text-white">{emp.full_name}</p>
                  <p className="text-[10px] text-slate-500">{emp.email} • {emp.role.replace('_', ' ')}</p>
                </div>
                <button
                  onClick={() => handleGenerate(emp.id)}
                  disabled={generating === emp.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-all disabled:opacity-50"
                >
                  {generating === emp.id ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Smartphone className="w-3 h-3" />
                  )}
                  Generate Token
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
