"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
const ruleCreator_js_1 = require("../utils/ruleCreator.js");
const verifiers_js_1 = require("../utils/verifiers.js");
//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------
exports.default = (0, ruleCreator_js_1.createRule)({
    name: "ts-package-json-homepage",
    meta: {
        type: "suggestion",
        docs: {
            description: "force package.json's homepage value to be a URL pointing to your library's readme inside the git repo",
        },
        messages: {
            ...verifiers_js_1.VerifierMessages,
            BadHomepage: "homepage is not a URL pointing to your library's readme inside the git repo",
        },
        schema: [],
        fixable: "code",
    },
    defaultOptions: [],
    create(context) {
        const verifiers = (0, verifiers_js_1.getVerifiers)(context, {
            outer: "homepage",
        });
        if ((0, verifiers_js_1.stripPath)(context.filename) !== "package.json") {
            return {};
        }
        return {
            // check to see if homepage exists at the outermost level
            "ExpressionStatement > ObjectExpression": verifiers.existsInFile,
            // check the node corresponding to homepage to see if its value is a URL pointing to your library's readme inside the git repo
            "ExpressionStatement > ObjectExpression > Property[key.value='homepage']": (node) => {
                const nodeValue = node.value;
                if (!/^https:\/\/github.com\/Azure\/azure-sdk-for-js\/(blob|tree)\/main\/sdk\/(([a-z]+-)*[a-z]+\/)+(README\.md)?$/.test(nodeValue.value)) {
                    context.report({
                        node: nodeValue,
                        messageId: "BadHomepage",
                    });
                }
            },
        };
    },
});
//# sourceMappingURL=ts-package-json-homepage.js.map