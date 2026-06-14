import { createBrowserClient } from '@supabase/ssr'

function fetchWithTimeout(
  url: string | URL | Request,
  options: RequestInit = {},
  timeoutMs = 15000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const signal = options.signal;
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }

  return fetch(url, {
    ...options,
    cache: 'no-store',
    signal: controller.signal
  }).finally(() => {
    clearTimeout(id);
  });
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
    {
      global: {
        fetch: (url, options) => fetchWithTimeout(url, options, 15000)
      }
    }
  )
}
