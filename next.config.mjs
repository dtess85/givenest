/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.photos.sparkplatform.com" },
      { protocol: "https", hostname: "cdn.resize.sparkplatform.com" },
    ],
    // Cache optimized images for 1 year (default is 60s, which caused the
    // home hero to re-download on every revisit). Static assets like the hero
    // don't change without a deploy, so a long TTL is safe.
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },
  // Long-lived browser cache for files in /public/images — the hero image
  // in particular is a large static asset that should never be refetched
  // once the browser has it.
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/buy/manual-80917834-d005-4a02-abc4-f1b85bf2d7c5",
        destination: "/buy/20260403004044674827000000",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
