import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: [
        "src/components/hr-dashboard/App.tsx",
        "src/components/hr-dashboard/CollapsibleSidebar.tsx",
        "src/components/hr-dashboard/hr-modules.ts",
        "src/components/hr-dashboard/notifications.ts",
      ],
      exclude: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
      thresholds: {
        statements: 85,
        branches: 85,
        functions: 85,
        lines: 85,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
