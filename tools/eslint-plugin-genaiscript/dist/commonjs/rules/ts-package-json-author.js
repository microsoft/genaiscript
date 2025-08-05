"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @file Rule to force package.json's author value to be set to "Microsoft Corporation".
 *
 */
const ruleCreator_js_1 = require("../utils/ruleCreator.js");
const verifiers_js_1 = require("../utils/verifiers.js");
//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------
exports.default = (0, ruleCreator_js_1.createRule)({
    name: "ts-package-json-author",
    meta: {
        type: "suggestion",
        docs: {
            description: "force package.json's author value to be 'Microsoft Corporation'",
        },
        messages: {
            ...verifiers_js_1.VerifierMessages,
        },
        schema: [],
        fixable: "code",
    },
    defaultOptions: [],
    create(context) {
        const verifiers = (0, verifiers_js_1.getVerifiers)(context, {
            outer: "author",
            expected: "Microsoft Corporation",
        });
        if ((0, verifiers_js_1.stripPath)(context.filename) !== "package.json") {
            return {};
        }
        return {
            // check to see if author exists at the outermost level
            "ExpressionStatement > ObjectExpression": verifiers.existsInFile,
            // check the node corresponding to author to see if its value is "Microsoft Corporation"
            "ExpressionStatement > ObjectExpression > Property[key.value='author']": verifiers.outerMatchesExpected,
        };
    },
});
//# sourceMappingURL=ts-package-json-author.js.map