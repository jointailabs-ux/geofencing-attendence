import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GeoAttend — Sign In',
  description: 'Sign in to GeoAttend workforce management',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full animate-orb-float"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 -right-48 w-[500px] h-[500px] rounded-full animate-orb-float"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.12), transparent 70%)', animationDelay: '-7s' }}
        />
        <div
          className="absolute -bottom-32 left-1/3 w-80 h-80 rounded-full animate-orb-float"
          style={{ background: 'radial-gradient(circle, rgba(244,63,94,0.1), transparent 70%)', animationDelay: '-13s' }}
        />
        <div
          className="absolute top-1/4 left-1/2 w-64 h-64 rounded-full animate-orb-float"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.08), transparent 70%)', animationDelay: '-4s' }}
        />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(to right, rgba(139,92,246,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center relative"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' }}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-5 h-5 text-white"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              GeoAttend
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Workforce Management Platform
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
