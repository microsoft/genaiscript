// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * @file Rule to force Node support for all LTS versions.
 *
 */

import { createRule } from "../utils/ruleCreator.js";
import {
  VerifierMessageIds,
  VerifierMessages,
  getVerifiers,
  stripPath,
} from "../utils/verifiers.js";

/**
 * definition of LTS Node versions
 * * needs updating as definitions change
 */
export const LTS = ">=22.0.0";
export type Options = [
  {
    nodeVersionOverride?: string;
  },
];

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

export default createRule<Options, VerifierMessageIds>({
  name: "ts-package-json-engine-is-present",
  meta: {
    type: "suggestion",
    docs: {
      description: "Check engines field is set to current Node LTS",
    },
    messages: {
      ...VerifierMessages,
    },
    schema: [
      {
        type: "object",
        properties: {
          nodeVersionOverride: {
            type: "string",
            default: LTS,
            description: "Allows specifying a different node version than the current default",
          },
        },
      },
    ],
    fixable: "code",
  },
  defaultOptions: [{}],
  create(context) {
    const version = context.options[0]?.nodeVersionOverride ?? LTS;

    const verifiers = getVerifiers(context, {
      outer: "engines",
      inner: "node",
      expected: version,
    });
    if (stripPath(context.filename) !== "package.json") {
      return {};
    }
    return {
      // check to see if engines exists at the outermost level
      "ExpressionStatement > ObjectExpression": verifiers.existsInFile,

      // check that node is a member of engines
      "ExpressionStatement > ObjectExpression > Property[key.value='engines']":
        verifiers.isMemberOf,

      // check the node corresponding to engines.node to see if it is set to '>=8.0.0'
      "ExpressionStatement > ObjectExpression > Property[key.value='engines'] > ObjectExpression > Property[key.value='node']":
        verifiers.innerMatchesExpected,
    };
  },
});
