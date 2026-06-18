'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createStoreProfile } from '@/app/actions/store'
import { Store, Loader2, ArrowRight, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function OnboardingPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  
  // Auto-slug generation
  const [storeName, setStoreName] = useState('')
  const [storeSlug, setStoreSlug] = useState('')

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setStoreName(val)
    setStoreSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, '-'))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData()
    formData.append('storeName', storeName)
    formData.append('storeSlug', storeSlug)

    try {
      const result = await createStoreProfile(formData)
      if (result?.error) {
        setError(result.error)
        toast.error(result.error)
        setIsShaking(true)
        setTimeout(() => setIsShaking(false), 500)
      } else if (result?.redirectTo) {
        toast.success("Store created successfully!")
        window.location.href = result.redirectTo
      }
    } catch (err: any) {
      const msg = err?.message || JSON.stringify(err) || "An unexpected error occurred."
      setError(msg)
      toast.error(msg)
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 selection:bg-cyan-500/30 font-sans relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-900/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Background Image with Blue Overlay */}
        <div 
          className="absolute inset-0 z-[-1] bg-cover bg-center bg-no-repeat fixed"
          style={{ backgroundImage: "url('/login-bg.png')" }}
        >
          <div className="absolute inset-0 bg-blue-950/80 backdrop-blur-[2px]" />
        </div>

        <div className="text-center mb-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 flex items-center justify-center mb-4 group transition-transform hover:scale-105 active:scale-95 relative overflow-hidden">
              <img src="/Logo_cashitab.png" alt="CASHITAB Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase select-none text-white leading-none">
              CASHITAB
            </h1>
            <p className="text-blue-200 font-bold tracking-[0.2em] uppercase text-[8px] mt-2 opacity-60">Store Setup</p>
          </div>
          <h2 className="text-xl font-bold text-white mb-1 tracking-tight">Set up your store</h2>
          <p className="text-slate-400 font-medium text-sm">Tell us a bit about your business to get started.</p>
        </div>

        <div className={`w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl transition-transform ${isShaking ? 'animate-shake' : ''}`}>
          {error && (
            <div className="mb-6 p-4 bg-red-500/5 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Store Name</label>
              <input
                type="text"
                name="storeName"
                value={storeName}
                onChange={handleNameChange}
                required
                placeholder="Ice Cold Foods Ltd."
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-light"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Store URL Prefix</label>
              <div className="flex border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50 shadow-inner focus-within:ring-2 focus-within:ring-cyan-500/50 transition-all">
                <span className="bg-slate-900/80 text-slate-500 px-4 py-3 font-mono text-sm border-r border-slate-800 flex items-center select-none">
                  cashitab.shop/
                </span>
                <input
                  type="text"
                  name="storeSlug"
                  value={storeSlug}
                  onChange={(e) => setStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  required
                  placeholder="ice-cold-foods"
                  className="w-full bg-transparent px-4 py-3 text-cyan-400 focus:outline-none font-medium font-mono lowercase tracking-tight"
                />
              </div>
              <p className="text-xs text-slate-500 font-light pl-2">This is the link your managers will use.</p>
            </div>

            <button
              type="submit"
              disabled={loading || !storeName || !storeSlug}
              className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl px-4 py-3.5 flex items-center justify-center gap-2 hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create Store
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
