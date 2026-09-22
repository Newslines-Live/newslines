import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "newslines.org" },
      { protocol: "https", hostname: "**.wp.com" },
      { protocol: "https", hostname: "i0.wp.com" },
      { protocol: "https", hostname: "i1.wp.com" },
      { protocol: "https", hostname: "i2.wp.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "commons.wikimedia.org" },
    ],
  },
  async redirects() {
    const toGettingStarted = [
      "/login",
      "/log-in",
      "/signin",
      "/sign-in",
      "/signup",
      "/sign-up",
      "/register",
      "/wp-login.php",
      "/wp-admin",
      "/my-account",
      "/lost-password",
      "/lostpassword",
      "/contribute",
      "/become-a-contributor",
    ];
    return [
      ...toGettingStarted.map((source) => ({
        source,
        destination: "/getting-started",
        permanent: true,
      })),
      {
        source: "/wp-admin/:path*",
        destination: "/getting-started",
        permanent: true,
      },
      {
        source: "/my-account/:path*",
        destination: "/getting-started",
        permanent: true,
      },
      { source: "/privacy", destination: "/privacy-policy", permanent: true },
      { source: "/author/:path*", destination: "/grid", permanent: true },
      { source: "/comments/feed", destination: "/", permanent: true },
      { source: "/feed", destination: "/", permanent: true },
      { source: "/comment/:path*", destination: "/", permanent: true },
      {
        source: "/:topic/:event/comment-page-:n",
        destination: "/:topic/:event",
        permanent: true,
      },
      {
        source: "/:topic/:event/feed",
        destination: "/:topic/:event",
        permanent: true,
      },
      {
        source: "/:topic/:event/attachment/:slug*",
        destination: "/:topic/:event",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
