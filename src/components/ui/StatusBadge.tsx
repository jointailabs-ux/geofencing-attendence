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
  { label: string; bg: string; text: string; dotColor: string }
> = {
  present: {
    label: 'Present',
    bg: 'rgba(16,185,129,0.12)',
    text: '#34d399',
    dotColor: '#10B981',
  },
  absent: {
    label: 'Absent',
    bg: 'rgba(239,68,68,0.12)',
    text: '#f87171',
    dotColor: '#EF4444',
  },
  late: {
    label: 'Late',
    bg: 'rgba(245,158,11,0.12)',
    text: '#fbbf24',
    dotColor: '#F59E0B',
  },
  pending: {
    label: 'Pending',
    bg: 'rgba(100,116,139,0.12)',
    text: '#94a3b8',
    dotColor: '#94A3B8',
  },
  approved: {
    label: 'Approved',
    bg: 'rgba(16,185,129,0.12)',
    text: '#34d399',
    dotColor: '#10B981',
  },
  rejected: {
    label: 'Rejected',
    bg: 'rgba(239,68,68,0.12)',
    text: '#f87171',
    dotColor: '#EF4444',
  },
  flagged: {
    label: 'Flagged',
    bg: 'rgba(245,158,11,0.12)',
    text: '#fbbf24',
    dotColor: '#F59E0B',
  },
  active: {
    label: 'Active',
    bg: 'rgba(16,185,129,0.12)',
    text: '#34d399',
    dotColor: '#10B981',
  },
  inactive: {
    label: 'Inactive',
    bg: 'rgba(100,116,139,0.12)',
    text: '#94a3b8',
    dotColor: '#64748B',
  },
  fixed: {
    label: 'Fixed',
    bg: 'rgba(139,92,246,0.12)',
    text: '#a78bfa',
    dotColor: '#8B5CF6',
  },
  daily: {
    label: 'Daily',
    bg: 'rgba(6,182,212,0.12)',
    text: '#67e8f9',
    dotColor: '#06B6D4',
  },
  hourly: {
    label: 'Hourly',
    bg: 'rgba(244,63,94,0.12)',
    text: '#fb7185',
    dotColor: '#F43F5E',
  },
  super_admin: {
    label: 'Super Admin',
    bg: 'rgba(139,92,246,0.12)',
    text: '#a78bfa',
    dotColor: '#8B5CF6',
  },
  manager: {
    label: 'Manager',
    bg: 'rgba(6,182,212,0.12)',
    text: '#67e8f9',
    dotColor: '#06B6D4',
  },
  staff: {
    label: 'Staff',
    bg: 'rgba(100,116,139,0.12)',
    text: '#94a3b8',
    dotColor: '#94A3B8',
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
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        className
      )}
      style={{
        background: config.bg,
        color: config.text,
        border: `1px solid ${config.text}20`,
      }}
    >
      {showDot && (
        <span
          className={cn('rounded-full flex-shrink-0', size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2')}
          style={{
            background: config.dotColor,
            boxShadow: `0 0 4px ${config.dotColor}60`,
          }}
        />
      )}
      {displayLabel}
    </span>
  )
}
