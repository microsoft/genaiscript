"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("vitest/config");
exports.default = (0, config_1.defineConfig)({
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
