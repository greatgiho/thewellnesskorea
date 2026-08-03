/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

/**
 * Allow images from whatever Supabase is configured, exactly as configured.
 *
 * The hostname used to be read off the URL while the protocol was pinned to
 * https and the port dropped — fine for a hosted project, but a self-hosted
 * one on http with a port never matched, so next/image refused every stored
 * photo. It went unnoticed because no local partner had one until now.
 */
const supabaseImagePatterns = (() => {
  if (!supabaseUrl) return []
  const url = new URL(supabaseUrl)
  return [
    {
      protocol: url.protocol.replace(":", ""),
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
      pathname: "/storage/v1/object/public/**",
    },
  ]
})()

const nextConfig = {
  // Pin the workspace root: multiple lockfiles exist above this dir
  // (e.g. ~/pnpm-lock.yaml), which Turbopack would otherwise infer as root.
  turbopack: {
    root: import.meta.dirname,
  },
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
      ...supabaseImagePatterns,
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
}

export default nextConfig
