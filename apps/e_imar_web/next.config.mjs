const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }
];

function normalizePublicUrl(value) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const candidate = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(candidate).toString().replace(/\/+$/, "");
  } catch {
    return undefined;
  }
}

function readRewriteApiBase() {
  return (
    normalizePublicUrl(process.env.NEXT_PUBLIC_API_BASE_URL) ||
    normalizePublicUrl(process.env.NEXT_PUBLIC_EIMAR_API_BASE_URL) ||
    "http://localhost:3000"
  ).replace(/\/api\/v1\/?$/, "");
}

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
    const apiBase = readRewriteApiBase();
    return [
      { source: "/api/v1/:path*", destination: `${apiBase}/api/v1/:path*` },
      { source: "/website/:path*", destination: `${apiBase}/website/:path*` },
      { source: "/connectors/:path*", destination: `${apiBase}/connectors/:path*` }
    ];
  }
};

export default nextConfig;
