import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s — GeoAttend',
    default: 'GeoAttend — Geofencing Attendance Management',
  },
  description:
    'Professional geofencing-based attendance, leave, and payroll management for multi-outlet businesses',
  keywords: ['attendance', 'geofencing', 'payroll', 'workforce management'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}
