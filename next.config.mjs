/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! 警告 !!
    // 暂时忽略构建时的 TS 错误
    // 在生产环境中不建议这样做
    ignoreBuildErrors: true,
  },
  eslint: {
    // 暂时忽略构建时的 ESLint 错误
    ignoreDuringBuilds: true,
  },
  // 启用增量静态再生成
  revalidate: 60,
  
  // 启用图片优化
  images: {
    domains: ['your-domain.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
    ],
  },

  // 启用 SWC 编译器
  swcMinify: true,

  // 启用实验性功能
  experimental: {
    serverActions: true,
    serverComponents: true,
  }
};

export default nextConfig;
