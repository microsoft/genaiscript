// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * @file Rule to force package.json's repository value to be set to github:Microsoft/genaiscript.
 *
 */

import { createRule } from "../utils/ruleCreator.js";
import { VerifierMessages, getVerifiers, stripPath } from "../utils/verifiers.js";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

export default createRule({
  name: "ts-package-json-repo",
  meta: {
    type: "suggestion",
    docs: {
      description: "force package.json's repository value to be 'github:Microsoft/genaiscript'",
    },
    messages: {
      ...VerifierMessages,
    },
    schema: [],
    fixable: "code",
  },
  defaultOptions: [],
  create(context) {
    const verifiers = getVerifiers(context, {
      outer: "repository",
      expected: "github:Microsoft/genaiscript",
    });

    if (stripPath(context.filename) !== "package.json") {
      return {};
    }
    return {
      // check to see if repository exists at the outermost level
      "ExpressionStatement > ObjectExpression": verifiers.existsInFile,

      // check the node corresponding to repository to see if its value is github:Azure/azure-sdk-for-js
      "ExpressionStatement > ObjectExpression > Property[key.value='repository']":
        verifiers.outerMatchesExpected,
    };
  },
});
