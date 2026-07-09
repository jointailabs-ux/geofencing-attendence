'use client'

import { useState } from 'react'
import { login } from '@/app/actions/auth'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="geo-card max-w-md w-full relative group overflow-hidden">
      {/* Decorative neon orb inside the card */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/20 rounded-full blur-[60px] pointer-events-none group-hover:bg-accent/30 transition-colors duration-700" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/10 rounded-full blur-[60px] pointer-events-none" />

      <div className="relative z-10 mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 mb-4 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <svg className="w-8 h-8 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
        </div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">
            Welcome to GeoAttend
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Enter your credentials to access the portal
        </p>
      </div>

      {error && (
        <div className="relative z-10 flex items-start gap-2.5 bg-danger/10 border border-danger/20 rounded-lg px-4 py-3 mb-6 animate-fade-in shadow-[0_0_15px_rgba(239,68,68,0.15)]">
          <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@company.com"
            className="w-full bg-[#0F0A0A]/50 border border-[#2A1C1C] rounded-xl px-4 py-3 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-300 shadow-inner"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="w-full bg-[#0F0A0A]/50 border border-[#2A1C1C] rounded-xl px-4 py-3 pr-11 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-300 shadow-inner"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-accent transition-colors p-1"
              tabIndex={-1}
            >
              {showPassword ? (
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
          className="w-full relative group flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-bold text-sm uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed mt-4 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] overflow-hidden"
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Authenticating...
            </>
          ) : (
            'Sign in securely'
          )}
        </button>
      </form>

      <p className="relative z-10 text-center text-xs text-slate-500 mt-8">
        Protected by GeoAttend Enterprise Security
      </p>
    </div>
  )
}
