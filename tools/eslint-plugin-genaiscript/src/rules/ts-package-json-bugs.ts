// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * @file Rule to force package.json's bugs.url value to be "https://github.com/Microsoft/genaiscript/issues".
 *
 */

import { createRule } from "../utils/ruleCreator.js";
import { VerifierMessages, getVerifiers, stripPath } from "../utils/verifiers.js";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

export default createRule({
  name: "ts-package-json-bugs",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "force package.json's bugs.url value to be 'https://github.com/Microsoft/genaiscript/issues'",
    },
    messages: { ...VerifierMessages },
    schema: [],
    fixable: "code",
  },
  defaultOptions: [],
  create(context) {
    const verifiers = getVerifiers(context, {
      outer: "bugs",
      inner: "url",
      expected: "https://github.com/Azure/azure-sdk-for-js/issues",
    });

    if (stripPath(context.filename) !== "package.json") {
      return {};
    }
    return {
      // check to see if bugs exists at the outermost level
      "ExpressionStatement > ObjectExpression": verifiers.existsInFile,

      // check that url is a member of bugs
      "ExpressionStatement > ObjectExpression > Property[key.value='bugs']": verifiers.isMemberOf,

      // check the node corresponding to bugs.url to see if it is set to 'https://github.com/Azure/azure-sdk-for-js/issues'
      "ExpressionStatement > ObjectExpression > Property[key.value='bugs'] > ObjectExpression > Property[key.value='url']":
        verifiers.innerMatchesExpected,
    };
  },
});
