import type { MetadataRoute } from "next"
import { BRAND_ASSETS } from "@/lib/brand/assets"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Wellness Korea",
    short_name: "Wellness Korea",
    description:
      "A premium K-Wellness brand for living your time well at Brickwell, Seochon.",
    start_url: "/",
    display: "standalone",
    background_color: "#F9F6F0",
    theme_color: "#3F5E4D",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: BRAND_ASSETS.appIcon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: BRAND_ASSETS.appIcon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
