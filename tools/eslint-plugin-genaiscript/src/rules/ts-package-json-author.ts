// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * @file Rule to force package.json's author value to be set to "Microsoft Corporation".
 *
 */

import { createRule } from "../utils/ruleCreator.js";
import { VerifierMessages, getVerifiers, stripPath } from "../utils/verifiers.js";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

export default createRule({
  name: "ts-package-json-author",
  meta: {
    type: "suggestion",
    docs: {
      description: "force package.json's author value to be 'Microsoft Corporation'",
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
      outer: "author",
      expected: "Microsoft Corporation",
    });

    if (stripPath(context.filename) !== "package.json") {
      return {};
    }

    return {
      // check to see if author exists at the outermost level
      "ExpressionStatement > ObjectExpression": verifiers.existsInFile,

      // check the node corresponding to author to see if its value is "Microsoft Corporation"
      "ExpressionStatement > ObjectExpression > Property[key.value='author']":
        verifiers.outerMatchesExpected,
    };
  },
});
