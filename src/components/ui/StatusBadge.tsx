import { cn } from '@/lib/utils'

export type StatusVariant =
  | 'present'
  | 'absent'
  | 'late'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'flagged'
  | 'active'
  | 'inactive'
  | 'fixed'
  | 'daily'
  | 'hourly'
  | 'super_admin'
  | 'manager'
  | 'staff'

const variantConfig: Record<
  StatusVariant,
  { label: string; className: string; dotClass: string }
> = {
  present: {
    label: 'Present',
    className: 'bg-valid/10 text-valid border-valid/20',
    dotClass: 'bg-valid',
  },
  absent: {
    label: 'Absent',
    className: 'bg-danger/10 text-danger border-danger/20',
    dotClass: 'bg-danger',
  },
  late: {
    label: 'Late',
    className: 'bg-warn/10 text-warn border-warn/20',
    dotClass: 'bg-warn',
  },
  pending: {
    label: 'Pending',
    className: 'bg-[#334155]/60 text-slate-300 border-[#475569]',
    dotClass: 'bg-slate-400',
  },
  approved: {
    label: 'Approved',
    className: 'bg-valid/10 text-valid border-valid/20',
    dotClass: 'bg-valid',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-danger/10 text-danger border-danger/20',
    dotClass: 'bg-danger',
  },
  flagged: {
    label: 'Flagged',
    className: 'bg-warn/10 text-warn border-warn/20',
    dotClass: 'bg-warn',
  },
  active: {
    label: 'Active',
    className: 'bg-valid/10 text-valid border-valid/20',
    dotClass: 'bg-valid',
  },
  inactive: {
    label: 'Inactive',
    className: 'bg-[#334155]/60 text-slate-400 border-[#475569]',
    dotClass: 'bg-slate-500',
  },
  fixed: {
    label: 'Fixed',
    className: 'bg-accent/10 text-accent border-accent/20',
    dotClass: 'bg-accent',
  },
  daily: {
    label: 'Daily',
    className: 'bg-accent/10 text-accent border-accent/20',
    dotClass: 'bg-accent',
  },
  hourly: {
    label: 'Hourly',
    className: 'bg-accent/10 text-accent border-accent/20',
    dotClass: 'bg-accent',
  },
  super_admin: {
    label: 'Super Admin',
    className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    dotClass: 'bg-purple-400',
  },
  manager: {
    label: 'Manager',
    className: 'bg-accent/10 text-accent border-accent/20',
    dotClass: 'bg-accent',
  },
  staff: {
    label: 'Staff',
    className: 'bg-[#334155]/60 text-slate-300 border-[#475569]',
    dotClass: 'bg-slate-400',
  },
}

interface StatusBadgeProps {
  variant: StatusVariant
  label?: string
  showDot?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function StatusBadge({
  variant,
  label,
  showDot = true,
  size = 'sm',
  className,
}: StatusBadgeProps) {
  const config = variantConfig[variant]
  const displayLabel = label ?? config.label

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        config.className,
        className
      )}
    >
      {showDot && (
        <span className={cn('rounded-full flex-shrink-0', size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2', config.dotClass)} />
      )}
      {displayLabel}
    </span>
  )
}
