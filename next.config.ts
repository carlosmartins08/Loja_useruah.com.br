import path from 'path';
import type {NextConfig} from 'next';

const qaNextDistDir = process.env.QA_NEXT_DIST_DIR?.trim();

const nextConfig: NextConfig = {
  ...(qaNextDistDir ? { distDir: qaNextDistDir } : {}),
  outputFileTracingRoot: path.join(__dirname),
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1', '::1'],
  // Allow access to remote image placeholder.
  images: {
    qualities: [65, 68, 70, 72, 75],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  transpilePackages: ['motion'],
  webpack: (config, { dev }) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify; file watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
  async redirects() {
    return [
      { source: '/admin/support', destination: '/support', permanent: false },
      { source: '/admin/support/:orderId', destination: '/support/:orderId', permanent: false },
      { source: '/admin/production', destination: '/production', permanent: false },
      { source: '/admin/finance/payouts', destination: '/finance/payouts', permanent: false },
      { source: '/finance/dashboard', destination: '/finance', permanent: false },
      { source: '/account/artist', destination: '/artist', permanent: false },
      { source: '/account/community', destination: '/community', permanent: false },
      { source: '/account/supplier', destination: '/supplier', permanent: false },
      { source: '/account/affiliate', destination: '/affiliate', permanent: false },
    ];
  },
};

export default nextConfig;
