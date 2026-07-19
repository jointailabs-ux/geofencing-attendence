'use client'

import { useState } from 'react'
import { login } from '@/app/actions/auth'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [showPin, setShowPin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await login(formData)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
    // On success, the server action redirects — no need to handle here
  }
  return (
    <div className="relative group overflow-hidden rounded-2xl p-6"
      style={{
        background: 'linear-gradient(145deg, rgba(17, 24, 39, 0.85), rgba(10, 15, 30, 0.95))',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(139, 92, 246, 0.15)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 60px rgba(139,92,246,0.05)',
      }}>
      {/* Decorative gradient orbs inside the card */}
      <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[60px] pointer-events-none group-hover:opacity-100 opacity-70 transition-opacity duration-700"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.25), transparent)' }} />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full blur-[60px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.15), transparent)' }} />

      <div className="relative z-10 mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.1))',
            border: '1px solid rgba(139,92,246,0.2)',
            boxShadow: '0 0 24px rgba(139,92,246,0.15)',
          }}>
            <svg className="w-8 h-8 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
        </div>
        <h1 className="text-3xl font-bold tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #ffffff, #c4b5fd, #67e8f9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Welcome to GeoAttend
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Enter your secure PIN to access the portal
        </p>
      </div>

      {error && (
        <div className="relative z-10 flex items-start gap-2.5 rounded-xl px-4 py-3 mb-6 animate-fade-in"
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            boxShadow: '0 0 15px rgba(239,68,68,0.1)',
          }}>
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
        <div>
          <label htmlFor="pin" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
            6-Digit PIN
          </label>
          <div className="relative">
            <input
              id="pin"
              name="pin"
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              pattern="[0-9]*"
              required
              placeholder="••••••"
              className="w-full rounded-xl px-4 py-3 pr-11 text-white placeholder:text-slate-600 text-sm focus:outline-none transition-all duration-300 shadow-inner tracking-[0.5em] text-center font-mono text-xl"
              style={{
                background: 'rgba(17, 24, 39, 0.6)',
                border: '1px solid rgba(139, 92, 246, 0.1)',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(139, 92, 246, 0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(139, 92, 246, 0.1)'; e.target.style.boxShadow = 'none'; }}
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-violet-400 transition-colors p-1"
              tabIndex={-1}
            >
              {showPin ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full relative group/btn flex items-center justify-center gap-2 text-white font-bold text-sm uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed mt-4 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
            boxShadow: '0 0 24px rgba(139, 92, 246, 0.3)',
          }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.boxShadow = '0 0 40px rgba(139, 92, 246, 0.5), 0 0 60px rgba(6, 182, 212, 0.2)'; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.boxShadow = '0 0 24px rgba(139, 92, 246, 0.3)'; }}
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Authenticating...
            </>
          ) : (
            'Secure Login'
          )}
        </button>
      </form>

      <p className="relative z-10 text-center text-xs text-slate-500 mt-8">
        Protected by GeoAttend Enterprise Security
      </p>
    </div>
  )
}
