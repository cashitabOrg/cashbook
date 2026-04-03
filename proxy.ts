import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/', '/login', '/register']

export async function proxy(request: NextRequest) {
  try {
    let supabaseResponse = NextResponse.next({
      request,
    })

    // Create a supabase client configured to use cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
      {
        auth: {
          persistSession: false,
        },
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
              supabaseResponse = NextResponse.next({
                request,
              })
              cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options)
              )
            } catch (error) {
              // Ignore cookie parsing/setting errors in Edge runtime
            }
          },
        },
      }
    )

    // This will trigger the setAll if the session is refreshed
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl
    
    // Helper to ensure cookies stay in sync on redirects
    const redirect = (target: string) => {
      const url = new URL(target, request.url)
      const res = NextResponse.redirect(url)
      // Copy all cookies from the live Supabase response to the redirect
      supabaseResponse.cookies.getAll().forEach(c => {
        res.cookies.set(c.name, c.value)
      })
      return res
    }

    // Handle public routes
    if (PUBLIC_ROUTES.includes(pathname)) {
      if (user) {
        try {
          const { data: profile } = await supabase.from('users').select('role, stores(slug)').eq('id', user.id).single()
          if (profile) {
            // @ts-ignore
            const slug = profile.stores?.slug
            if (profile.role === 'super_admin') return redirect('/super-admin/dashboard')
            if (profile.role === 'admin') return redirect(slug ? `/${slug}/admin/dashboard` : '/onboarding')
            if (profile.role === 'manager' && slug) return redirect(`/${slug}/manager/sales`)
          }
        } catch (err) {
          console.error('[Proxy] Public route profile check error:', err)
        }
      }
      return supabaseResponse
    }

    // Handle protected routes
    if (!user || authError) {
      return redirect('/login')
    }

    // User is authenticated, check role for route protection
    const { data: profile } = await supabase.from('users').select('role, is_active, stores(slug)').eq('id', user.id).single()
    
    if (!profile || !profile.is_active) {
      // If account is deactivated, sign out and go to login
      await supabase.auth.signOut()
      return redirect('/login')
    }

    // @ts-ignore
    const userSlug = profile.stores?.slug

    // 1. Super Admin checking
    if (pathname.startsWith('/super-admin')) {
      if (profile.role !== 'super_admin') return redirect('/login')
      return supabaseResponse
    }

    // 2. Onboarding checking
    if (pathname === '/onboarding') {
      if (profile.role !== 'admin') return redirect('/login')
      if (userSlug) return redirect(`/${userSlug}/admin/dashboard`)
      return supabaseResponse
    }

    // 3. Admin routes checking (/[storeSlug]/admin/...)
    const matchAdmin = pathname.match(/^\/([^/]+)\/admin\//)
    if (matchAdmin) {
      const urlSlug = matchAdmin[1]
      if (profile.role !== 'admin' || userSlug !== urlSlug) {
        // If manager tried to hit admin, send to sales point
        if (profile.role === 'manager' && userSlug) {
          return redirect(`/${userSlug}/manager/sales`)
        }
        return redirect(userSlug ? `/${userSlug}/admin/dashboard` : '/onboarding')
      }
      return supabaseResponse
    }

    // 4. Manager routes checking (/[storeSlug]/manager/...)
    const matchManager = pathname.match(/^\/([^/]+)\/manager\//)
    if (matchManager) {
      const urlSlug = matchManager[1]
      if (profile.role !== 'manager' || userSlug !== urlSlug) {
         if (profile.role === 'admin' && userSlug) return redirect(`/${userSlug}/admin/dashboard`)
         return redirect('/login')
      }
      return supabaseResponse
    }

    return supabaseResponse
  } catch (error) {
    console.error('[Proxy] Unhandled exception:', error)
    // On unexpected edge errors, gracefully continue so the app still renders, 
    // or fallback to login if we suspect auth token issues. 
    // NextResponse.next() is safer to avoid redirect loops.
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|sw\\.js|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
