/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react"]
  },
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_EIMAR_API_BASE_URL || "http://localhost:3000";
    return [
      { source: "/api/v1/:path*", destination: `${apiBase}/:path*` },
      { source: "/website/:path*", destination: `${apiBase}/website/:path*` },
      { source: "/connectors/:path*", destination: `${apiBase}/connectors/:path*` }
    ];
  }
};

export default nextConfig;
