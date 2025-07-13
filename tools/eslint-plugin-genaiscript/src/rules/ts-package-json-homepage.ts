// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * @file Rule to force package.json's homepage value to be a URL pointing to your library's readme inside the git repo.
 *
 */

import { TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/ruleCreator.js";
import { VerifierMessages, getVerifiers, stripPath } from "../utils/verifiers.js";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

export default createRule({
  name: "ts-package-json-homepage",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "force package.json's homepage value to be a URL pointing to your library's readme inside the git repo",
    },
    messages: {
      ...VerifierMessages,
      BadHomepage: "homepage is not a URL pointing to your library's readme inside the git repo",
    },
    schema: [],
    fixable: "code",
  },
  defaultOptions: [],
  create(context) {
    const verifiers = getVerifiers(context, {
      outer: "homepage",
    });
    if (stripPath(context.filename) !== "package.json") {
      return {};
    }

    return {
      // check to see if homepage exists at the outermost level
      "ExpressionStatement > ObjectExpression": verifiers.existsInFile,

      // check the node corresponding to homepage to see if its value is a URL pointing to your library's readme inside the git repo
      "ExpressionStatement > ObjectExpression > Property[key.value='homepage']": (
        node: TSESTree.Property,
      ): void => {
        const nodeValue = node.value as TSESTree.Literal;

        if (
          !/^https:\/\/github.com\/Azure\/azure-sdk-for-js\/(blob|tree)\/main\/sdk\/(([a-z]+-)*[a-z]+\/)+(README\.md)?$/.test(
            nodeValue.value as string,
          )
        ) {
          context.report({
            node: nodeValue,
            messageId: "BadHomepage",
          });
        }
      },
    };
  },
});
