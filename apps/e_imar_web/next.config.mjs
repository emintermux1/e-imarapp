/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react"]
  },
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_EIMAR_API_BASE_URL || "http://localhost:8000";
    return [{ source: "/api/v1/:path*", destination: `${apiBase}/api/v1/:path*` }];
  },
  webpack: (config, { isServer }) => {
    config.resolve = config.resolve ?? {};
    config.resolve.fallback = {
      ...(config.resolve.fallback ?? {}),
      fs: false,
      http: false,
      https: false,
      zlib: false,
      url: false,
      buffer: false
    };
    if (!isServer) {
      config.module = config.module ?? {};
      config.module.unknownContextCritical = false;
    }
    return config;
  }
};

export default nextConfig;
