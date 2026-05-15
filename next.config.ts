import type { NextConfig } from "next";

const imageKitEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
const imageKitUrl = imageKitEndpoint ? new URL(imageKitEndpoint) : null;

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    preloadEntriesOnStart: false,
  },
  images: {
    remotePatterns: [
      ...(imageKitUrl
        ? [
            {
              protocol: imageKitUrl.protocol.replace(":", "") as "http" | "https",
              hostname: imageKitUrl.hostname,
              port: imageKitUrl.port,
              pathname: "/**",
              search: "",
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
