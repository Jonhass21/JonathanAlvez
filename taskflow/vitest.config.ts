import { defineConfig } from "vitest/config";

// Unit tests only cover the pure logic (parser, dates, filters), so they run in
// plain Node — no jsdom, no React plugin.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
