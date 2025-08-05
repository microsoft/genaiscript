"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @file Rule to force package.json's repository value to be set to github:Microsoft/genaiscript.
 *
 */
const ruleCreator_js_1 = require("../utils/ruleCreator.js");
const verifiers_js_1 = require("../utils/verifiers.js");
//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------
exports.default = (0, ruleCreator_js_1.createRule)({
    name: "ts-package-json-repo",
    meta: {
        type: "suggestion",
        docs: {
            description: "force package.json's repository value to be 'github:Microsoft/genaiscript'",
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
            outer: "repository",
            expected: "github:Microsoft/genaiscript",
        });
        if ((0, verifiers_js_1.stripPath)(context.filename) !== "package.json") {
            return {};
        }
        return {
            // check to see if repository exists at the outermost level
            "ExpressionStatement > ObjectExpression": verifiers.existsInFile,
            // check the node corresponding to repository to see if its value is github:Azure/azure-sdk-for-js
            "ExpressionStatement > ObjectExpression > Property[key.value='repository']": verifiers.outerMatchesExpected,
        };
    },
});
//# sourceMappingURL=ts-package-json-repo.js.map