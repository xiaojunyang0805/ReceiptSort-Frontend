import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
  experimental: {
    // Externalize packages with native binaries for serverless
    serverComponentsExternalPackages: ['@napi-rs/canvas', 'canvas'],
  },
};

export default withNextIntl(nextConfig);
