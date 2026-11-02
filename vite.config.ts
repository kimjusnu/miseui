/// <reference types="vitest/config" />
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

const root = fileURLToPath(new URL(".", import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": root } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["registry/**/*.test.tsx", "src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["registry/miseui/**/*.{ts,tsx}", "scripts/skill-format.ts"],
      exclude: ["**/*.test.{ts,tsx}"],
      thresholds: { lines: 80, functions: 80 },
    },
  },
})
