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

  // Configure webpack to handle canvas native module
  webpack: (config, { isServer }) => {
    if (isServer) {
      // For server-side rendering, mark canvas as external
      // This prevents webpack from bundling the native .node files
      config.externals = config.externals || [];
      config.externals.push({
        canvas: 'commonjs canvas',
      });
    }

    return config;
  },
};

export default withNextIntl(nextConfig);
