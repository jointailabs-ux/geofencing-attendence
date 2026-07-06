import Link from 'next/link'
import { MapPinOff } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="geo-card text-center max-w-md w-full py-12">
        <MapPinOff className="w-16 h-16 mx-auto mb-6 text-slate-500 opacity-50" />
        <h1 className="text-3xl font-bold text-white mb-2">404</h1>
        <h2 className="text-xl font-semibold text-slate-300 mb-4">Off the map!</h2>
        <p className="text-slate-400 mb-8">
          We couldn&apos;t find the page you&apos;re looking for. It might have been moved or deleted.
        </p>
        <Link 
          href="/" 
          className="inline-block bg-accent hover:bg-accent-hover text-white px-6 py-2.5 rounded-xl font-semibold transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}
