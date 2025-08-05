"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.GROQEvaluate = GROQEvaluate;
const groq_js_1 = require("groq-js");
/**
 * Loads and applies a GROQ query transformation to the input dataset.
 * @param query GROQ query string to parse and evaluate.
 * @param dataset The input dataset to apply the query to. Returns undefined if not provided.
 * @param options Optional configurations such as root and query parameters.
 */
async function GROQEvaluate(query, dataset, options) {
    if (dataset === undefined)
        return dataset;
    const tree = (0, groq_js_1.parse)(query);
    const value = await (0, groq_js_1.evaluate)(tree, { dataset, ...(options || {}) });
    const res = await value.get();
    return res;
}
//# sourceMappingURL=groq.js.map