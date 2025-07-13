"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @file Rule to force package.json's license value to be set to "MIT".
 */
const ruleCreator_js_1 = require("../utils/ruleCreator.js");
const verifiers_js_1 = require("../utils/verifiers.js");
//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------
exports.default = (0, ruleCreator_js_1.createRule)({
    name: "ts-package-json-license",
    meta: {
        type: "suggestion",
        docs: {
            description: "force package.json's license value to be 'MIT'",
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
            outer: "license",
            expected: "MIT",
        });
        if ((0, verifiers_js_1.stripPath)(context.filename) !== "package.json") {
            return {};
        }
        return {
            // check to see if license exists at the outermost level
            "ExpressionStatement > ObjectExpression": verifiers.existsInFile,
            // check the node corresponding to license to see if its value is "MIT"
            "ExpressionStatement > ObjectExpression > Property[key.value='license']": verifiers.outerMatchesExpected,
        };
    },
});
//# sourceMappingURL=ts-package-json-license.js.map