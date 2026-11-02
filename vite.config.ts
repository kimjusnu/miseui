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
    // Tests that re-import motion after vi.resetModules take seconds while the whole suite runs in parallel.
    testTimeout: 20000,
    include: ["registry/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["registry/miseui/**/*.{ts,tsx}", "scripts/skill-format.ts"],
      exclude: ["**/*.test.{ts,tsx}"],
      thresholds: { lines: 80, functions: 80 },
    },
  },
})
