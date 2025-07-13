// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * An object containing processors used by the plugin
 */
export default {
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