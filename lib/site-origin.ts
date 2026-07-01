export function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://thewellnesskorea.com"
}
