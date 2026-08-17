import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "node",
    // Production runs on a UTC server; this machine is in Seoul. Pinning the
    // test clock to UTC means a formatter that forgets its timezone fails here
    // instead of on the site — which is how the journal and roster dates were
    // wrong for months while every local check looked right (#223).
    env: { TZ: "UTC" },
    globals: true,
    include: ["**/__tests__/**/*.test.ts", "**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
