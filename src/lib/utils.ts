import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula. Returns distance in meters.
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Returns YYYY-MM-DD string in Asia/Kolkata (IST) timezone
 */
export function getISTDateString(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(date)
}

/**
 * Returns a JS Date object converted to Asia/Kolkata timezone
 */
export function getISTDate(date = new Date()): Date {
  const tzString = date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
  return new Date(tzString)
}

/**
 * Returns the start of the day in IST as a UTC Date object
 */
export function getISTStartOfDay(date = new Date()): Date {
  const dateStr = getISTDateString(date)
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
  d.setMinutes(d.getMinutes() - 330)
  return d
}

/**
 * Returns the end of the day in IST as a UTC Date object
 */
export function getISTEndOfDay(date = new Date()): Date {
  const dateStr = getISTDateString(date)
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
  d.setMinutes(d.getMinutes() - 330)
  return d
}

// ─── Client-side IST formatting helpers ─────────────────────────────────────
// All these force timeZone: 'Asia/Kolkata' so the display is always IST,
// regardless of the user's browser or server timezone.

const IST = 'Asia/Kolkata'

/** Format a date string/Date to IST time like "02:30 PM" */
export function formatISTTime(dateInput: string | Date, opts?: { hour12?: boolean }): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  return d.toLocaleTimeString('en-IN', {
    timeZone: IST,
    hour: '2-digit',
    minute: '2-digit',
    hour12: opts?.hour12 ?? true,
  })
}

/** Format a date string/Date to IST time with seconds like "02:30:45 PM" */
export function formatISTTimeFull(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  return d.toLocaleTimeString('en-IN', {
    timeZone: IST,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

/** Format a date string/Date to IST date like "24 Jul 2026" */
export function formatISTDate(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  return d.toLocaleDateString('en-IN', {
    timeZone: IST,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Format a date string/Date to IST short date like "24 Jul" */
export function formatISTDateShort(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  return d.toLocaleDateString('en-IN', {
    timeZone: IST,
    day: 'numeric',
    month: 'short',
  })
}

/** Format a date string/Date to IST date+time like "24 Jul 2026, 02:30 PM" */
export function formatISTDateTime(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  return d.toLocaleString('en-IN', {
    timeZone: IST,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

