/** @type {import('next').NextConfig} */
const nextConfig = {
    // Add image configuration here
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                port: '',
                pathname: '/**',
            },
             // Add other allowed domains here if needed in the future
        ],
    },
    // Add other Next.js configurations here if needed
    webpack: (config, { isServer }) => {
      // polling を有効にする (開発環境のみ)
      if (!isServer && process.env.NODE_ENV === 'development') {
        config.watchOptions = {
          poll: 1000, // 1秒ごとにポーリング
          aggregateTimeout: 300, // 変更をまとめて処理するまでの待機時間
        };
      }
      return config;
    },
};

module.exports = nextConfig;
