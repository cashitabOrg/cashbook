import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent @react-pdf/renderer (and its canvas deps) from being server-bundled.
  // Without this, Next.js tries to process the library during SSR and calls
  // browser-only APIs like `frame.join`, causing a TypeError at runtime.
  transpilePackages: ["@react-pdf/renderer"],
};

export default nextConfig;
