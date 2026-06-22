/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseHostname = supabaseUrl
  ? new URL(supabaseUrl).hostname
  : undefined

const nextConfig = {
  serverExternalPackages: ["isomorphic-dompurify", "jsdom"],
  async redirects() {
    return [
      {
        source: "/people/:slug",
        destination: "/partners/:slug",
        permanent: true,
      },
      {
        source: "/admin/people/:path*",
        destination: "/admin/partners/:path*",
        permanent: true,
      },
    ]
  },
  images: {
    remotePatterns: [
      ...(supabaseHostname
        ? [
            {
              protocol: "https",
              hostname: supabaseHostname,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
}

export default nextConfig
