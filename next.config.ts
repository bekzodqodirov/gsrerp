import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Kirim (intake) rasmlarni (mahsulot + umumiy qabul) ko'p sonli yuklash imkonini
      // beradi — standart 1mb limit hatto bitta telefon suratiga ham yetmaydi.
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
