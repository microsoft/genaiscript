"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.LTS = void 0;
/**
 * @file Rule to force Node support for all LTS versions.
 *
 */
const ruleCreator_js_1 = require("../utils/ruleCreator.js");
const verifiers_js_1 = require("../utils/verifiers.js");
/**
 * definition of LTS Node versions
 * * needs updating as definitions change
 */
exports.LTS = ">=22.0.0";
//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------
exports.default = (0, ruleCreator_js_1.createRule)({
    name: "ts-package-json-engine-is-present",
    meta: {
        type: "suggestion",
        docs: {
            description: "Check engines field is set to current Node LTS",
        },
        messages: {
            ...verifiers_js_1.VerifierMessages,
        },
        schema: [
            {
                type: "object",
                properties: {
                    nodeVersionOverride: {
                        type: "string",
                        default: exports.LTS,
                        description: "Allows specifying a different node version than the current default",
                    },
                },
            },
        ],
        fixable: "code",
    },
    defaultOptions: [{}],
    create(context) {
        const version = context.options[0]?.nodeVersionOverride ?? exports.LTS;
        const verifiers = (0, verifiers_js_1.getVerifiers)(context, {
            outer: "engines",
            inner: "node",
            expected: version,
        });
        if ((0, verifiers_js_1.stripPath)(context.filename) !== "package.json") {
            return {};
        }
        return {
            // check to see if engines exists at the outermost level
            "ExpressionStatement > ObjectExpression": verifiers.existsInFile,
            // check that node is a member of engines
            "ExpressionStatement > ObjectExpression > Property[key.value='engines']": verifiers.isMemberOf,
            // check the node corresponding to engines.node to see if it is set to '>=8.0.0'
            "ExpressionStatement > ObjectExpression > Property[key.value='engines'] > ObjectExpression > Property[key.value='node']": verifiers.innerMatchesExpected,
        };
    },
});
//# sourceMappingURL=ts-package-json-engine-is-present.js.map