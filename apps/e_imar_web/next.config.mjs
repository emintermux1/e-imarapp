const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react"]
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders
      }
    ];
  },
  async rewrites() {
    const rawApiBase =
      process.env.NEXT_PUBLIC_EIMAR_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
    const apiBase = rawApiBase.replace(/\/api\/v1\/?$/, "");
    return [
      { source: "/api/v1/:path*", destination: `${apiBase}/api/v1/:path*` },
      { source: "/website/:path*", destination: `${apiBase}/website/:path*` },
      { source: "/connectors/:path*", destination: `${apiBase}/connectors/:path*` }
    ];
  }
};

export default nextConfig;
