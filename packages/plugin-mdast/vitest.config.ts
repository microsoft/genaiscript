// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 50000,
    hookTimeout: 50000,
    include: ["test/**/*.test.ts"],
    exclude: ["node_modules", "dist", "build", "coverage"],
    environment: "node",
    coverage: {
      provider: "istanbul",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      all: true,
      include: ["src/**/*.ts"],
      exclude: ["**/*.d.ts", "**/test/**"],
    },
  },
});
