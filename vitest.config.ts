import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const fromRoot = (path: string) =>
  fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": fromRoot("./src"),
      "server-only": fromRoot("./src/test/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    minWorkers: 1,
    maxWorkers: 2,
    testTimeout: 15_000,
    setupFiles: ["./src/test/setup.ts"],
    restoreMocks: true,
    unstubEnvs: true,
  },
});
