"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @file Rule to require copyright headers in every source file.
 */
const ruleCreator_js_1 = require("../utils/ruleCreator.js");
const MINIMUM_NUMBER_COMMENTS_REQUIRED = 1;
const validHeader1 = ["Copyright (c) Microsoft Corporation.", "Licensed under the MIT License."];
const validLicenseText = ` * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
`;
const expectedComments = `// ${validHeader1.join("\n// ")}\n\n`;
function isValid(comments) {
    if (comments.length < MINIMUM_NUMBER_COMMENTS_REQUIRED) {
        return false;
    }
    if (validHeader1
        .map((l, idx) => ({ expected: l, actual: comments[idx] }))
        .every((v) => v.actual.type === "Line" && v.expected === v.actual.value.trim())) {
        return true;
    }
    return comments[0].type === "Block" && comments[0].value.includes(validLicenseText);
}
exports.default = (0, ruleCreator_js_1.createRule)({
    name: "github-source-headers",
    meta: {
        type: "suggestion",
        docs: {
            description: "require copyright headers in every source file",
        },
        messages: {
            noCopyrightHeader: "the file does not have a correct copyright header",
        },
        schema: [],
        fixable: "code",
    },
    defaultOptions: [],
    create(context) {
        if (!/\.ts|\.mts|\.cts$/.test(context.filename)) {
            return {};
        }
        return {
            Program: (node) => {
                const sourceCode = context.sourceCode;
                const headerComments = sourceCode.getCommentsBefore(node);
                if (!isValid(headerComments)) {
                    const targetNode = headerComments[0] || node;
                    context.report({
                        node: targetNode,
                        messageId: "noCopyrightHeader",
                        fix: (fixer) => fixer.insertTextBefore(targetNode, expectedComments),
                    });
                }
            },
        };
    },
});
//# sourceMappingURL=github-source-headers.js.map