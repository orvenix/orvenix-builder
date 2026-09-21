import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control",      value: "on" },
  { key: "X-Frame-Options",             value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options",      value: "nosniff" },
  { key: "Referrer-Policy",             value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",          value: "camera=(), microphone=(), geolocation=()" },
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],

  experimental: {
    webpackBuildWorker: false,
  },

  devIndicators: false,

  pageExtensions: ["tsx", "ts", "jsx", "js"],

  // Prisma client runtime needed in server bundles
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-mariadb"],

  images: {
    // External image optimization is brittle in restricted/self-hosted environments.
    // Serving remote assets directly avoids runtime 500s on marketing pages.
    unoptimized: true,
    // Note: unoptimized:true above already bypasses this allowlist check
    // entirely (it only applies when Next's image optimizer runs). Kept
    // for documentation/future-compatibility if unoptimized is ever
    // reverted, not because it enforces anything today.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // Compresión y optimizaciones de producción
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
