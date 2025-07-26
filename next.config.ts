/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@balkangraph/familytree.js"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;