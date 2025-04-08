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
};

module.exports = nextConfig;
