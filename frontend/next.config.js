/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/dang-nhap',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-unsafe-none' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
        ],
      },
    ]
  },
}

module.exports = nextConfig

