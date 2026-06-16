import { defineConfig } from "vitest/config";

export default defineConfig({
  // Resolves the "@/*" path alias from tsconfig (native in Vite/Vitest 4).
  resolve: { tsconfigPaths: true },
  test: {
    // Gallery logic (Seam 1) is pure — no DOM. Component / E2E tests that need
    // WebGL or a browser are a documented follow-up (Seam 2, Playwright).
    environment: "node",
    include: ["app/**/*.test.ts"],
  },
});
