// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * @file Rule to require copyright headers in every source file.
 */

import { createRule } from "../utils/ruleCreator.js";
import { TSESTree } from "@typescript-eslint/utils";

const MINIMUM_NUMBER_COMMENTS_REQUIRED = 1;
const validHeader1 = ["Copyright (c) Microsoft Corporation.", "Licensed under the MIT License."];
const validLicenseText = ` * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
`;

const expectedComments = `// ${validHeader1.join("\n// ")}\n\n`;

function isValid(comments: TSESTree.Comment[]): boolean {
  if (comments.length < MINIMUM_NUMBER_COMMENTS_REQUIRED) {
    return false;
  }

  if (
    validHeader1
      .map((l, idx) => ({ expected: l, actual: comments[idx] }))
      .every((v) => v.actual.type === "Line" && v.expected === v.actual.value.trim())
  ) {
    return true;
  }

  return comments[0].type === "Block" && comments[0].value.includes(validLicenseText);
}

export default createRule({
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
      Program: (node): void => {
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
