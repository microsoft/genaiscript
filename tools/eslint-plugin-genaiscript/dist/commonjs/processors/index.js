"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * An object containing processors used by the plugin
 */
exports.default = {
    /**
     * The processor for JSON files
     * Ignores the no-unused-expressions ESLint rule
     */
    ".json": {
        preprocess: (text) => [text],
        postprocess: (messages) => messages[0].filter((message) => message.ruleId !== "no-unused-expressions"),
        supportsAutofix: true,
    },
};
//# sourceMappingURL=index.js.map