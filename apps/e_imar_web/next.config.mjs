/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react"]
  },
  // Cesium is a large dependency that depends on `window` / `document` and
  // expects its own static assets to be served from a base URL set on the
  // global before its modules are imported. We:
  // 1) lazy-load it from the client only (see `cesium-init.ts` & dynamic imports).
  // 2) tell webpack not to try to polyfill node-only modules it references.
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
      // Cesium emits AMD-style `define` calls in some Workers; keep webpack
      // from trying to interpret them.
      config.module = config.module ?? {};
      config.module.unknownContextCritical = false;
    }
    return config;
  }
};

export default nextConfig;
