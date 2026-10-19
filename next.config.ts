import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Слева внизу — панель учебных сценариев, значок dev-режима уносим вправо.
  devIndicators: { position: "bottom-right" },
  // 90 — для полноэкранного баннера: на тёмных градиентах 75 даёт заметные артефакты.
  images: { qualities: [75, 90] },
  async redirects() {
    return [{ source: "/", destination: "/catalog", permanent: false }];
  },
};

export default nextConfig;
