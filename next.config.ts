import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.5.148"],
  serverExternalPackages: ["@prisma/client"],
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
              // dev 模式需要 'unsafe-eval'：Next.js 的 React Refresh runtime 依赖它做 HMR；
              // 生产构建不需要，保持严格 CSP。
              { key: "Content-Security-Policy", value: `default-src 'self'; script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV !== "production" ? "'unsafe-eval'" : ""} https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self' https://www.googletagmanager.com; font-src 'self' https://fonts.gstatic.com; frame-src 'self';` },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      // Serve the static welcome page directly at "/" — bypasses React/Next runtime
      // for the landing experience to keep TTI minimal. The quiz lives at /test.
      { source: "/", destination: "/index.html" },
    ];
  },
};

export default nextConfig;
