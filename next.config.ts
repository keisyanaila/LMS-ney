import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Batas upload file 4 MB (lihat lib/storage.ts) + sedikit ruang untuk
      // overhead multipart. Vercel membatasi body request sekitar 4,5 MB.
      bodySizeLimit: "4.5mb",
    },
  },
};

export default nextConfig;
