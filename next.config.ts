import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable optimizations for development
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tooltip',
      'lucide-react',
      'framer-motion'
    ],
  },
  
  // Optimize webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Enable faster builds in development
    if (dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
            },
            blocksuite: {
              test: /[\\/]node_modules[\\/](@blocksuite|blocksuite|yjs|y-protocols)[\\/]/,
              name: 'blocksuite',
              priority: 10,
              chunks: 'all',
            },
            tambo: {
              test: /[\\/]node_modules[\\/]@tambo-ai[\\/]/,
              name: 'tambo',
              priority: 10,
              chunks: 'all',
            },
          },
        },
      };
    }

    // Fix for BlockSuite packages when they are used
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
      };
    }
    
    // Handle yjs imports properly
    config.resolve.alias = {
      ...config.resolve.alias,
      'yjs': 'yjs',
    };

    // Keep default devtool for better performance in development
    // Custom devtool settings can cause severe performance regressions

    return config;
  },

  // Enable compression and caching
  compress: true,
  poweredByHeader: false,
  
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // SWC minification is enabled by default in Next.js 15

  // Configure headers for better caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

export default nextConfig;