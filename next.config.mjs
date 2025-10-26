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
  // Externalize native modules that can't be webpack bundled
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize @napi-rs/canvas to prevent webpack from bundling native binaries
      config.externals.push({
        '@napi-rs/canvas': 'commonjs @napi-rs/canvas',
      });
    }
    return config;
  },
};

export default withNextIntl(nextConfig);
