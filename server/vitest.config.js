import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup/test-env.js"],
    include: ["tests/**/*.test.js"],
    exclude: ["tests/performance/**"],
    fileParallelism: false,
    restoreMocks: true,
    clearMocks: true,
  },
});
