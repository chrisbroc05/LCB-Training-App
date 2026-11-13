import type { NextConfig } from "next";
import { PUBLIC_PDF_FREE_LANDING_REDIRECTS } from "./lib/public-pdf-redirects-shared";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest: "public",
  register: false,
  customWorkerDir: "worker",
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline.html",
  },
  runtimeCaching: [
    {
      // Keep uptime probes out of the service worker cache.
      urlPattern: /\/api\/health(?:\?.*)?$/,
      handler: "NetworkOnly",
      options: {},
    },
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
  experimental: {
    proxyClientMaxBodySize: "500mb",
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/workouts",
        destination: "/resources",
        permanent: true,
      },
      ...PUBLIC_PDF_FREE_LANDING_REDIRECTS,
    ];
  },
};

export default withPWA(nextConfig);
