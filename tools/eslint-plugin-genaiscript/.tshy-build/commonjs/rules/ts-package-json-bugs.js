"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @file Rule to force package.json's bugs.url value to be "https://github.com/Microsoft/genaiscript/issues".
 *
 */
const ruleCreator_js_1 = require("../utils/ruleCreator.js");
const verifiers_js_1 = require("../utils/verifiers.js");
//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------
exports.default = (0, ruleCreator_js_1.createRule)({
    name: "ts-package-json-bugs",
    meta: {
        type: "suggestion",
        docs: {
            description: "force package.json's bugs.url value to be 'https://github.com/Microsoft/genaiscript/issues'",
        },
        messages: { ...verifiers_js_1.VerifierMessages },
        schema: [],
        fixable: "code",
    },
    defaultOptions: [],
    create(context) {
        const verifiers = (0, verifiers_js_1.getVerifiers)(context, {
            outer: "bugs",
            inner: "url",
            expected: "https://github.com/Azure/azure-sdk-for-js/issues",
        });
        if ((0, verifiers_js_1.stripPath)(context.filename) !== "package.json") {
            return {};
        }
        return {
            // check to see if bugs exists at the outermost level
            "ExpressionStatement > ObjectExpression": verifiers.existsInFile,
            // check that url is a member of bugs
            "ExpressionStatement > ObjectExpression > Property[key.value='bugs']": verifiers.isMemberOf,
            // check the node corresponding to bugs.url to see if it is set to 'https://github.com/Azure/azure-sdk-for-js/issues'
            "ExpressionStatement > ObjectExpression > Property[key.value='bugs'] > ObjectExpression > Property[key.value='url']": verifiers.innerMatchesExpected,
        };
    },
});
//# sourceMappingURL=ts-package-json-bugs.js.map