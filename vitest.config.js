import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/game-logic.js"],
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 90,
        branches: 80
      }
    }
  }
});
