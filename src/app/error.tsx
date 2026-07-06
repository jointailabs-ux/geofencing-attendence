'use client'
 
import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service in production
    console.error(error)
  }, [error])
 
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="geo-card text-center max-w-md w-full py-12">
        <AlertTriangle className="w-16 h-16 mx-auto mb-6 text-danger opacity-80" />
        <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-slate-400 mb-8 text-sm">
          An unexpected error occurred. We&apos;ve been notified and are looking into it.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2.5 rounded-xl font-semibold transition-colors bg-[#0F172A] text-slate-300 border border-[#1E293B] hover:text-white"
          >
            Go Home
          </button>
          <button
            onClick={() => reset()}
            className="bg-accent hover:bg-accent-hover text-white px-6 py-2.5 rounded-xl font-semibold transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}
