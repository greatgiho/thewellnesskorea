import fs from "node:fs"
import path from "node:path"
import sharp from "sharp"

const root = path.resolve(import.meta.dirname, "..")
const brandDir = path.join(root, "public/brand")
const appDir = path.join(root, "app")

const APP_BG = "#1C2821"
const FAVICON_BG = "#F9F6F0"

async function squareIcon({
  source,
  size,
  output,
  background,
  inset = 0.12,
}) {
  const inner = Math.round(size * (1 - inset * 2))
  const logo = await sharp(source)
    .flatten({ background })
    .resize(inner, inner, {
      fit: "inside",
      withoutEnlargement: false,
    })
    .png()
    .toBuffer()

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background,
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(output)
}

async function main() {
  const vertical = path.join(brandDir, "logo-vertical.jpg")
  const emblem = path.join(brandDir, "logo-emblem.jpg")

  await squareIcon({
    source: emblem,
    size: 180,
    output: path.join(appDir, "apple-icon.png"),
    background: FAVICON_BG,
    inset: 0.05,
  })

  await squareIcon({
    source: emblem,
    size: 32,
    output: path.join(appDir, "icon.png"),
    background: FAVICON_BG,
    inset: 0.06,
  })

  for (const size of [192, 512]) {
    await squareIcon({
      source: emblem,
      size,
      output: path.join(brandDir, `app-icon-${size}.png`),
      background: FAVICON_BG,
      inset: 0.05,
    })
  }

  console.log("Generated app icons in app/ and public/brand/")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
