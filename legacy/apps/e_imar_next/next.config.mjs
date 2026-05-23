/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {},
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    return [
      {
        source: '/api/website/:path*',
        destination: `${apiBase}/website/:path*`,
      },
      {
        source: '/api/map/:path*',
        destination: `${apiBase}/map/:path*`,
      },
    ];
  },
};
export default nextConfig;
