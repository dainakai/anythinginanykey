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
    // Cloudflare Pages向けの設定
    experimental: {
        // 全てのサーバーサイドルーティングでEdge Runtimeを使用
        runtime: 'experimental-edge',
    },
    // Cloudflare Pagesでのビルド時の設定
    webpack: (config, { isServer }) => {
      // polling を有効にする (開発環境のみ)
      if (!isServer && process.env.NODE_ENV === 'development') {
        config.watchOptions = {
          poll: 1000, // 1秒ごとにポーリング
          aggregateTimeout: 300, // 変更をまとめて処理するまでの待機時間
        };
      }

      // Edge Runtimeで動作する場合はいくつかのNodeモジュールをハンドリング
      if (isServer) {
        config.externals.push('@neondatabase/serverless', 'pg');
      }
      
      return config;
    },
};

module.exports = nextConfig;
