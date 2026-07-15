import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/workouts",
        destination: "/resources",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
