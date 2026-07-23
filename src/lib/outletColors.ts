export type OutletColorTheme = {
  name: string
  gradient: string
  bgTint: string
  border: string
  text: string
  badgeBg: string
  badgeText: string
  badgeBorder: string
  dot: string
}

const OUTLET_PALETTES: OutletColorTheme[] = [
  {
    name: 'Emerald Cyan',
    gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
    bgTint: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.3)',
    text: '#34d399',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeText: '#6ee7b7',
    badgeBorder: 'rgba(16, 185, 129, 0.35)',
    dot: '#10b981',
  },
  {
    name: 'Violet Pink',
    gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    bgTint: 'rgba(139, 92, 246, 0.08)',
    border: 'rgba(139, 92, 246, 0.3)',
    text: '#c084fc',
    badgeBg: 'rgba(139, 92, 246, 0.15)',
    badgeText: '#d8b4fe',
    badgeBorder: 'rgba(139, 92, 246, 0.35)',
    dot: '#8b5cf6',
  },
  {
    name: 'Amber Orange',
    gradient: 'linear-gradient(135deg, #f59e0b, #ea580c)',
    bgTint: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.3)',
    text: '#fbbf24',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeText: '#fde68a',
    badgeBorder: 'rgba(245, 158, 11, 0.35)',
    dot: '#f59e0b',
  },
  {
    name: 'Blue Indigo',
    gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    bgTint: 'rgba(59, 130, 246, 0.08)',
    border: 'rgba(59, 130, 246, 0.3)',
    text: '#60a5fa',
    badgeBg: 'rgba(59, 130, 246, 0.15)',
    badgeText: '#93c5fd',
    badgeBorder: 'rgba(59, 130, 246, 0.35)',
    dot: '#3b82f6',
  },
  {
    name: 'Rose Crimson',
    gradient: 'linear-gradient(135deg, #f43f5e, #be123c)',
    bgTint: 'rgba(244, 63, 94, 0.08)',
    border: 'rgba(244, 63, 94, 0.3)',
    text: '#fb7185',
    badgeBg: 'rgba(244, 63, 94, 0.15)',
    badgeText: '#fca5a5',
    badgeBorder: 'rgba(244, 63, 94, 0.35)',
    dot: '#f43f5e',
  },
  {
    name: 'Teal Lime',
    gradient: 'linear-gradient(135deg, #14b8a6, #84cc16)',
    bgTint: 'rgba(20, 184, 166, 0.08)',
    border: 'rgba(20, 184, 166, 0.3)',
    text: '#2dd4bf',
    badgeBg: 'rgba(20, 184, 166, 0.15)',
    badgeText: '#99f6e4',
    badgeBorder: 'rgba(20, 184, 166, 0.35)',
    dot: '#14b8a6',
  },
  {
    name: 'Sky Blue',
    gradient: 'linear-gradient(135deg, #0284c7, #2563eb)',
    bgTint: 'rgba(2, 132, 199, 0.08)',
    border: 'rgba(2, 132, 199, 0.3)',
    text: '#38bdf8',
    badgeBg: 'rgba(2, 132, 199, 0.15)',
    badgeText: '#7dd3fc',
    badgeBorder: 'rgba(2, 132, 199, 0.35)',
    dot: '#0284c7',
  },
  {
    name: 'Fuchsia Purple',
    gradient: 'linear-gradient(135deg, #d946ef, #7e22ce)',
    bgTint: 'rgba(217, 70, 239, 0.08)',
    border: 'rgba(217, 70, 239, 0.3)',
    text: '#e879f9',
    badgeBg: 'rgba(217, 70, 239, 0.15)',
    badgeText: '#f5d0fe',
    badgeBorder: 'rgba(217, 70, 239, 0.35)',
    dot: '#d946ef',
  },
]

export function getOutletColor(outletName?: string | null): OutletColorTheme {
  if (!outletName || outletName === 'Unassigned') {
    return {
      name: 'Slate',
      gradient: 'linear-gradient(135deg, #64748b, #475569)',
      bgTint: 'rgba(100, 116, 139, 0.04)',
      border: 'rgba(100, 116, 139, 0.2)',
      text: '#94a3b8',
      badgeBg: 'rgba(100, 116, 139, 0.1)',
      badgeText: '#cbd5e1',
      badgeBorder: 'rgba(100, 116, 139, 0.2)',
      dot: '#64748b',
    }
  }

  let hash = 0
  for (let i = 0; i < outletName.length; i++) {
    hash = outletName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % OUTLET_PALETTES.length
  return OUTLET_PALETTES[index]
}
