import path from "node:path"
import sharp from "sharp"

const root = path.resolve(import.meta.dirname, "..")
const brandDir = path.join(root, "public/brand")
const appDir = path.join(root, "app")
const appIconSource = path.join(brandDir, "logo-app-icon.jpg")

async function resizeIcon(source, size, output) {
  await sharp(source)
    .resize(size, size, { fit: "cover", position: "center" })
    .png()
    .toFile(output)
}

async function main() {
  await resizeIcon(appIconSource, 180, path.join(appDir, "apple-icon.png"))
  await resizeIcon(appIconSource, 32, path.join(appDir, "icon.png"))

  for (const size of [192, 512]) {
    await resizeIcon(
      appIconSource,
      size,
      path.join(brandDir, `app-icon-${size}.png`),
    )
  }

  console.log("Generated app icons from logo-app-icon.jpg")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
