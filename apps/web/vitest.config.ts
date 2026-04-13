import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "src/features/auth/dashboard-shell.test.tsx",
    ],
    environmentOptions: {
      jsdom: {
        url: "http://localhost:5001",
      },
    },
  },
});
