import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "joarrnifvwioibmzqsvd.supabase.co",
      },
    ],
  },
  async rewrites() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

    return [
      {
        source: "/api/stats/:path*",
        destination: `${apiBaseUrl}/api/stats/:path*`,
      },
      {
        source: "/api/trips/:path*",
        destination: `${apiBaseUrl}/api/trips/:path*`,
      },
      {
        source: "/api/members/:path*",
        destination: `${apiBaseUrl}/api/members/:path*`,
      },
    ];
  },
};

export default nextConfig;
