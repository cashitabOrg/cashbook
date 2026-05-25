'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerAdmin } from '@/app/actions/auth'
import { Snowflake, Loader2, ArrowRight, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isShaking, setIsShaking] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    
    // Check confirm password client-side before hitting the server
    if (formData.get('password') !== formData.get('confirmPassword')) {
      const msg = "Passwords do not match."
      setError(msg)
      toast.error(msg)
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
      setLoading(false)
      return
    }

    try {
      const result = await registerAdmin(formData)

      if (result?.error) {
        setError(result.error)
        toast.error(result.error)
        setIsShaking(true)
        setTimeout(() => setIsShaking(false), 500)
        setLoading(false)
        return
      }

      if (result?.redirectTo) {
        toast.success("Registration successful! Taking you to onboarding...")
        // Hard redirect to fully hydrate the application and proxy state
        window.location.href = result.redirectTo
        return
      }

      const msg = "Something went wrong. Please try again."
      setError(msg)
      toast.error(msg)
      setLoading(false)

    } catch (err: any) {
      const msg = err?.message || "An unexpected error occurred. Please try again."
      setError(msg)
      toast.error(msg)
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 selection:bg-[#0052FF]/20 font-sans relative overflow-hidden bg-slate-50">
      {/* Background Image with Light Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/login-bg.png')" }}
      >
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
      </div>

      {/* Decorative Blur */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0052FF]/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-300/20 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="w-full max-w-[460px] relative z-10">
        <div className={`bg-white/95 backdrop-blur-2xl border border-white p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-blue-900/10 transition-transform ${isShaking ? 'animate-shake' : ''}`}>
          
          <div className="flex flex-col items-center mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
              <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-105 relative overflow-hidden">
                <img src="/Logo_cashitab.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-black tracking-tight text-[#001A4D] uppercase">Cashitab</span>
            </Link>

            <h2 className="text-3xl font-bold text-[#001A4D] tracking-tight mb-2">Create your account</h2>
            <p className="text-slate-500 font-medium text-base">Start managing your business with intelligence.</p>
          </div>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#001A4D]">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="John Doe"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 text-[#001A4D] placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0052FF]/10 focus:border-[#0052FF] transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#001A4D]">Username</label>
                <input
                  type="text"
                  name="username"
                  required
                  placeholder="johndoe"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 text-[#001A4D] placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0052FF]/10 focus:border-[#0052FF] transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#001A4D]">Email Address</label>
              <input
                type="email"
                name="email"
                required
                placeholder="john@example.com"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 text-[#001A4D] placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0052FF]/10 focus:border-[#0052FF] transition-all font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#001A4D]">Password</label>
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 text-[#001A4D] placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0052FF]/10 focus:border-[#0052FF] transition-all font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#001A4D]">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                required
                placeholder="••••••••"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 text-[#001A4D] placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0052FF]/10 focus:border-[#0052FF] transition-all font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-[#0052FF] text-white font-bold rounded-xl px-4 py-4 flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-70 disabled:cursor-not-allowed group text-lg"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-base text-slate-600 font-medium">
          Already have an account?{' '}
          <Link href="/login" className="text-[#0052FF] hover:text-blue-700 font-bold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
