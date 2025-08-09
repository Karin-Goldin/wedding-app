import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations for high concurrency
  experimental: {
    optimizePackageImports: ["@supabase/supabase-js", "framer-motion"],
  },

  // Image optimization
  images: {
    domains: ["udyuyhbqnbamixqcosqm.supabase.co"],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
  },

  // Compression
  compress: true,

  // Headers for better caching
  async headers() {
    return [
      {
        source: "/api/upload",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
