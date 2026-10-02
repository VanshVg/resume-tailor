import { readFileSync } from "node:fs";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { z } from "zod";

/**
 * `vite preview` serves the production build with the same security headers
 * Vercel will send, so a too-strict CSP shows up locally before deploying.
 * vercel.json stays the single source of truth.
 */
const VercelConfig = z.object({
  headers: z.array(
    z.object({ headers: z.array(z.object({ key: z.string(), value: z.string() })) }),
  ),
});

function productionHeaders(): Record<string, string> {
  const config = VercelConfig.parse(JSON.parse(readFileSync("vercel.json", "utf8")));
  return Object.fromEntries(
    config.headers.flatMap((rule) => rule.headers.map((h) => [h.key, h.value] as const)),
  );
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  preview: { headers: productionHeaders() },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    restoreMocks: true,
  },
});
