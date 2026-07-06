'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signup } from '@/app/actions/auth'
import { Eye, EyeOff, Loader2, AlertCircle, Building2, CheckCircle2 } from 'lucide-react'

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    // Client-side validation
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      setIsLoading(false)
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      setIsLoading(false)
      return
    }

    const result = await signup(formData)
    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-8 shadow-2xl animate-slide-up">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-accent" />
          <span className="text-xs font-semibold text-accent uppercase tracking-wider">
            Organization Setup
          </span>
        </div>
        <h1 className="text-lg font-semibold text-white">Create your account</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          You&apos;ll be the Super Admin for your organization
        </p>
      </div>

      {/* Feature bullets */}
      <div className="bg-[#0F172A] rounded-lg p-3 mb-5 space-y-1.5">
        {[
          'Full access to outlets, employees & payroll',
          'Manage geofence rules for all locations',
          'Invite managers and staff after setup',
        ].map((feat) => (
          <div key={feat} className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-valid flex-shrink-0" />
            <span className="text-xs text-slate-400">{feat}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-danger/10 border border-danger/20 rounded-lg px-4 py-3 mb-5">
          <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="orgName" className="field-label">
            Organization name
          </label>
          <input
            id="orgName"
            name="orgName"
            type="text"
            required
            placeholder="Acme Restaurants Pvt. Ltd."
            className="field-input"
          />
        </div>

        <div>
          <label htmlFor="fullName" className="field-label">
            Your full name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            placeholder="John Smith"
            className="field-input"
          />
        </div>

        <div>
          <label htmlFor="email" className="field-label">
            Work email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="admin@yourcompany.com"
            className="field-input"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="password" className="field-label">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Min. 8 chars"
                className="field-input pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="field-label">
              Confirm
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Repeat password"
              className="field-input"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover
                     text-white font-semibold py-2.5 px-4 rounded-lg transition-colors
                     disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating organization…
            </>
          ) : (
            'Create organization & account'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-accent hover:text-accent-hover font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
