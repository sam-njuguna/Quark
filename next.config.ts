import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.neon.tech wss://*.neon.tech https://api.resend.com https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // Bundle size optimizations
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
    // Optimise named imports from large packages (tree-shaking)
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "@xyflow/react",
      "date-fns",
    ],
  },

  // Compress responses
  compress: true,

  // Production source maps off (reduces bundle size, use Sentry upload instead)
  productionBrowserSourceMaps: false,

  images: {
    // Modern formats only — smaller file sizes
    formats: ["image/avif", "image/webp"],
    // Cache immutable images for 1 year
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },
};

export default nextConfig;
