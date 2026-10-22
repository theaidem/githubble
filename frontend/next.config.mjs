// GitHub Pages build: a static export with no API route (the workflow removes
// src/app/api) that streams from the public deployment via NEXT_PUBLIC_SSE_URL.
const pages = process.env.GITHUB_PAGES === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: pages ? "export" : "standalone",
  basePath: pages ? process.env.PAGES_BASE_PATH || "" : "",
  images: pages ? { unoptimized: true } : undefined,
};

export default nextConfig;
