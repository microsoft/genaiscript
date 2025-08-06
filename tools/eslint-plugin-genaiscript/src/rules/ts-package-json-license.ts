// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * @file Rule to force package.json's license value to be set to "MIT".
 */

import { createRule } from "../utils/ruleCreator.js";
import { VerifierMessages, getVerifiers, stripPath } from "../utils/verifiers.js";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

export default createRule({
  name: "ts-package-json-license",
  meta: {
    type: "suggestion",
    docs: {
      description: "force package.json's license value to be 'MIT'",
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
      outer: "license",
      expected: "MIT",
    });
    if (stripPath(context.filename) !== "package.json") {
      return {};
    }
    return {
      // check to see if license exists at the outermost level
      "ExpressionStatement > ObjectExpression": verifiers.existsInFile,

      // check the node corresponding to license to see if its value is "MIT"
      "ExpressionStatement > ObjectExpression > Property[key.value='license']":
        verifiers.outerMatchesExpected,
    };
  },
});
