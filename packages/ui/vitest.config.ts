import { defineConfig } from "vitest/config";

// Only pure-TS modules are unit-tested here; components are covered by Storybook.
export default defineConfig({ test: { include: ["src/**/*.test.ts"] } });
