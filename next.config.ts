import type { NextConfig } from "next";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline.html",
  },
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\./,
      handler: "NetworkOnly",
      options: {},
    },
    {
      urlPattern: /^https:\/\/player\.vimeo\.com\/.*/,
      handler: "CacheFirst",
      options: {
        cacheName: "vimeo-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 7,
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "image-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
      },
    },
  ],
});

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

export default withPWA(nextConfig);
