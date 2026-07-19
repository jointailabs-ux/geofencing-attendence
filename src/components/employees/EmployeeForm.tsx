'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createEmployee, updateEmployee } from '@/app/actions/employees'
import type { Employee, Outlet, EmployeeRole } from '@/lib/types/database'
import { ArrowLeft, UserPlus, Loader2, Shield, Eye, EyeOff } from 'lucide-react'

const employeeSchema = z.object({
  employee_code: z.string().min(1, 'Employee ID is required').max(20),
  full_name: z.string().min(1, 'Full name is required').max(100),
  email: z.string().email('Invalid email address'),
  pin: z.string().length(6, 'PIN must be exactly 6 digits').regex(/^\d+$/, 'PIN must contain only numbers').optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.enum(['super_admin', 'manager', 'staff']),
  outlet_id: z.string().optional(),
  salary_type: z.enum(['fixed', 'daily', 'hourly']),
  base_salary: z.number().min(0, 'Must be positive'),
  join_date: z.string().min(1, 'Join date is required'),
})

type EmployeeFormData = z.infer<typeof employeeSchema>

interface EmployeeFormProps {
  employee?: Employee
  outlets: Pick<Outlet, 'id' | 'name'>[]
  callerRole: EmployeeRole
}

const roleOptions: { value: EmployeeRole; label: string; description: string }[] = [
  { value: 'super_admin', label: 'Super Admin', description: 'Full organization access' },
  { value: 'manager', label: 'Manager', description: 'Manage outlet attendance & leave' },
  { value: 'staff', label: 'Staff', description: 'Clock in/out, view own records' },
]

const salaryOptions = [
  { value: 'fixed', label: 'Fixed Monthly', description: 'Same amount every month' },
  { value: 'daily', label: 'Daily Rate', description: 'Paid per day worked' },
  { value: 'hourly', label: 'Hourly Rate', description: 'Paid per hour logged' },
]

export function EmployeeForm({ employee, outlets, callerRole }: EmployeeFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employee_code: employee?.employee_code ?? '',
      full_name: employee?.full_name ?? '',
      email: employee?.email ?? '',
      pin: '',
      phone: employee?.phone ?? '',
      role: employee?.role ?? 'staff',
      outlet_id: employee?.outlet_id ?? '',
      salary_type: employee?.salary_type ?? 'fixed',
      base_salary: employee?.base_salary ?? 0,
      join_date: employee?.join_date ?? new Date().toISOString().split('T')[0],
    },
  })

  const salaryType = watch('salary_type')
  const selectedRole = watch('role')
  const salaryLabel =
    salaryType === 'fixed' ? 'Monthly Salary (₹)' :
    salaryType === 'daily' ? 'Daily Rate (₹)' : 'Hourly Rate (₹)'

  async function onSubmit(data: EmployeeFormData) {
    setIsLoading(true)

    // For new employees, PIN is required
    if (!employee && (!data.pin || data.pin.length !== 6)) {
      toast.error('6-Digit PIN is required for new employees')
      setIsLoading(false)
      return
    }

    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'pin' && employee) return // Don't send PIN on edit (managed elsewhere)
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, String(value))
      }
    })

    try {
      if (employee) {
        const result = await updateEmployee(employee.id, formData)
        if (result?.error) {
          toast.error(result.error)
          setIsLoading(false)
          return
        }
        toast.success('Employee updated')
      } else {
        const result = await createEmployee(formData)
        if (result?.error) {
          toast.error(result.error)
          setIsLoading(false)
          return
        }
        toast.success('Employee created successfully')
      }
    } catch {
      // server redirect on success
    }
  }

  return (
    <div className="animate-fade-in">
      <Link
        href="/admin/employees"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Employees
      </Link>

      <div className="page-header">
        <h1 className="page-title">
          {employee ? 'Edit Employee' : 'Add Employee'}
        </h1>
        <p className="page-subtitle">
          {employee
            ? 'Update employee details and settings'
            : 'Create a new employee account with login credentials'}
        </p>
      </div>

      {!employee && (
        <div className="flex items-start gap-2.5 bg-accent/5 border border-accent/20 rounded-xl px-4 py-3 mb-6">
          <Shield className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-white">Admin-managed credentials</p>
            <p className="text-xs text-slate-400 mt-0.5">
              You set the employee&apos;s email and PIN. They can log in immediately with the PIN.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">

        {/* Login Credentials — only for new employees */}
        {!employee && (
          <div className="geo-card space-y-4">
            <h2 className="geo-card-title">Login Credentials</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="field-label">
                  Email address *
                </label>
                <input
                  id="email"
                  {...register('email')}
                  type="email"
                  placeholder="employee@company.com"
                  className="field-input"
                />
                {errors.email && <p className="field-error">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="pin" className="field-label">6-Digit PIN *</label>
                <div className="relative">
                  <input
                    id="pin"
                    {...register('pin')}
                    type={showPassword ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="••••••"
                    className="field-input pr-11 tracking-[0.2em] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.pin && <p className="field-error">{errors.pin.message}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Personal info */}
        <div className="geo-card space-y-4">
          <h2 className="geo-card-title">Personal Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="employee_code" className="field-label">Employee ID *</label>
              <input
                id="employee_code"
                {...register('employee_code')}
                type="text"
                placeholder="EMP001"
                className="field-input font-mono"
              />
              {errors.employee_code && <p className="field-error">{errors.employee_code.message}</p>}
            </div>

            <div>
              <label htmlFor="full_name" className="field-label">Full name *</label>
              <input
                id="full_name"
                {...register('full_name')}
                type="text"
                placeholder="Aisha Patel"
                className="field-input"
              />
              {errors.full_name && <p className="field-error">{errors.full_name.message}</p>}
            </div>

            {employee && (
              <div>
                <label htmlFor="email" className="field-label">Email address</label>
                <input
                  id="email"
                  {...register('email')}
                  type="email"
                  disabled
                  className="field-input disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            )}

            <div>
              <label htmlFor="phone" className="field-label">Phone number</label>
              <input
                id="phone"
                {...register('phone')}
                type="tel"
                placeholder="+91 98765 43210"
                className="field-input"
              />
            </div>

            <div>
              <label htmlFor="join_date" className="field-label">Join date *</label>
              <input
                id="join_date"
                {...register('join_date')}
                type="date"
                className="field-input"
              />
              {errors.join_date && <p className="field-error">{errors.join_date.message}</p>}
            </div>
          </div>
        </div>

        {/* Role & outlet */}
        <div className="geo-card space-y-4">
          <h2 className="geo-card-title">Role & Assignment</h2>

          <div>
            <label className="field-label">Role *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {roleOptions
                .filter((r) => callerRole === 'super_admin' || r.value === 'staff')
                .map(({ value, label, description }) => (
                  <label
                    key={value}
                    className="relative flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                               has-[:checked]:border-accent has-[:checked]:bg-accent/5
                               border-[#334155] hover:border-[#475569]"
                  >
                    <input
                      type="radio"
                      {...register('role')}
                      value={value}
                      className="mt-0.5 accent-accent"
                    />
                    <div>
                      <p className="text-sm font-medium text-white">{label}</p>
                      <p className="text-xs text-slate-500">{description}</p>
                    </div>
                  </label>
                ))}
            </div>
            {errors.role && <p className="field-error">{errors.role.message}</p>}
          </div>

          <div>
            <label htmlFor="outlet_id" className="field-label">
              Outlet assignment
              {selectedRole === 'super_admin' && (
                <span className="text-slate-600 font-normal ml-1">(optional for super admin)</span>
              )}
            </label>
            <select
              id="outlet_id"
              {...register('outlet_id')}
              className="field-input"
            >
              <option value="">— No outlet assigned —</option>
              {outlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Payroll */}
        <div className="geo-card space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="geo-card-title">Payroll Configuration</h2>
          </div>

          <div>
            <label className="field-label">Salary type *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {salaryOptions.map(({ value, label, description }) => (
                <label
                  key={value}
                  className="relative flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                             has-[:checked]:border-accent has-[:checked]:bg-accent/5
                             border-[#334155] hover:border-[#475569]"
                >
                  <input
                    type="radio"
                    {...register('salary_type')}
                    value={value}
                    className="mt-0.5 accent-accent"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="text-xs text-slate-500">{description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="base_salary" className="field-label">{salaryLabel} *</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
              <input
                id="base_salary"
                {...register('base_salary', { valueAsNumber: true })}
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                className="field-input pl-8"
              />
            </div>
            {errors.base_salary && <p className="field-error">{errors.base_salary.message}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {employee ? 'Saving…' : 'Creating…'}
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                {employee ? 'Save Changes' : 'Create Employee'}
              </>
            )}
          </button>
          <Link
            href="/admin/employees"
            className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
