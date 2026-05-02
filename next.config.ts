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
};

export default nextConfig;
