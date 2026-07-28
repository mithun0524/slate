import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // jsdom gives the session tests a real localStorage.
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
});
