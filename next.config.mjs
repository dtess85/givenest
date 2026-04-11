/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.photos.sparkplatform.com" },
      { protocol: "https", hostname: "cdn.resize.sparkplatform.com" },
    ],
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
