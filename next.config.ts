import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['https://api.crescentlearning.org', 'https://myapp.crescentlearning.org', 'http://localhost:3000', 'http://localhost:5173'],
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "https://api.crescentlearning.org",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ]
  },
}

export default nextConfig