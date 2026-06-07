/**
 * ============================================================
 * RSC SANITIZER
 * ============================================================
 * Deep-clones any value into a plain JSON-serializable object.
 *
 * WHY THIS EXISTS:
 * Supabase's PostgrestResponse and related objects carry internal
 * prototype properties and references that Turbopack's RSC wire-
 * protocol serializer cannot handle. When these objects cross the
 * Server → Client Component boundary as props, Turbopack crashes
 * with "Cannot read properties of undefined (reading 'stack')".
 *
 * Applying this to ALL data before passing it to client components
 * strips every non-plain value, ensuring only safe JSON crosses.
 *
 * USAGE: In any Server Component (page.tsx) that passes data to a
 * Client Component via props, wrap the data with `rscSanitize()`.
 * ============================================================
 */

/**
 * Deeply sanitizes `value` into plain JSON.
 * - Strips `undefined` → not included (use `null` explicitly if needed)
 * - Normalises Supabase prototype objects to plain object literals
 * - Safe to call on arrays, objects, primitives, and null
 */
export function rscSanitize<T>(value: T): T {
  if (value === null || value === undefined) return value;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    // Fallback: return as-is and let Next.js surface the real issue
    return value;
  }
}
