import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Content thumbnails go through a Server Action; images are capped at
      // 5MB, plus room for multipart overhead.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
