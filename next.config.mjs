/** @type {import('next').NextConfig} */
const isGitHubPagesBuild = process.env.GITHUB_PAGES === "true";
const basePath = isGitHubPagesBuild ? "/yubisuma" : "";

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  output: "export",
  trailingSlash: true,
  basePath,
  images: {
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath
  },
  experimental: {
    typedRoutes: false
  }
};

export default nextConfig;
