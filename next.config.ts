import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  serverExternalPackages: ["@prisma/client"],
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://www.googletagmanager.com; font-src 'self';" },
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
