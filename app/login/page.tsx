'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Snowflake, Loader2, ArrowRight, AlertCircle } from 'lucide-react'
import { loginUser } from '@/app/actions/auth'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isShaking, setIsShaking] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (loading) return
    
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      const res = await loginUser(formData);
      
      if (res?.error) {
        setError(res.error)
        toast.error(res.error)
        setIsShaking(true)
        setTimeout(() => setIsShaking(false), 500)
        setLoading(false)
        return
      }

      if (res?.redirectTo) {
        toast.success('Login successful! Redirecting...')
        window.location.href = res.redirectTo;
      }
    } catch (err: any) {
      const msg = err?.message || "An unexpected error occurred."
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

      <div className="w-full max-w-[420px] relative z-10 flex flex-col items-center">
        <div className={`w-full bg-white/95 backdrop-blur-2xl border border-white p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-blue-900/10 transition-transform ${isShaking ? 'animate-shake' : ''}`}>
          
          <div className="flex flex-col items-center mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
              <div className="w-10 h-10 rounded-xl bg-[#0052FF] flex items-center justify-center shadow-md shadow-blue-500/20 transition-transform group-hover:scale-105 border border-white/20 relative overflow-hidden">
                <img src="/logo-icon.png" alt="Logo" className="w-full h-full object-contain p-1" />
              </div>
              <span className="text-xl font-black tracking-tight text-[#001A4D] uppercase">Cashitab</span>
            </Link>

            <h2 className="text-3xl font-bold text-[#001A4D] tracking-tight mb-2">Welcome back</h2>
            <p className="text-slate-500 font-medium text-base">Sign in to your POS dashboard.</p>
          </div>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} method="POST" className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#001A4D]">Email or Username</label>
              <input
                type="text"
                name="email"
                required
                placeholder="Manager Username or Email"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 text-[#001A4D] placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0052FF]/10 focus:border-[#0052FF] transition-all font-medium"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#001A4D]">Password</label>
                <Link href="#" className="text-xs text-[#0052FF] hover:text-blue-700 font-bold transition-colors">
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                name="password"
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
                  Sign In
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-base text-slate-600 font-medium">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-[#0052FF] hover:text-blue-700 font-bold transition-colors">
            Start free trial
          </Link>
        </p>
      </div>
    </div>
  )
}
