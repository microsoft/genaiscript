// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * @file Helper methods for rules pertaining to JSON object structure
 */

import { TSESTree, TSESLint } from "@typescript-eslint/utils";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";

interface StructureData {
  outer: string;
  inner?: string;
  expected?: unknown;
}

interface Verifiers {
  existsInFile: (node: TSESTree.ObjectExpression) => void;
  outerMatchesExpected: (node: TSESTree.Property) => void;
  isMemberOf: (node: TSESTree.Property) => void;
  innerMatchesExpected: (node: TSESTree.Property) => void;
  outerContainsExpected: (node: TSESTree.Property) => void;
}

export const VerifierMessages = {
  outerMostNotExist: "{{outer}} does not exist at the outermost level",
  notMemberOf: "{{inner}} is not a member of {{outer}}",
  notALiteral: "{{expression}} is not set to a literal (string | boolean | null | number | RegExp)",
  actualNotExpected: "{{expression}} is set to {{actual}} when it should be set to {{expected}}",
  notArray: "{{outer}} is not set to an array",
  arrayContainsNonLiteral:
    "{{array}} contains non-literal (string | boolean | null | number | RegExp) elements",
  notContain: "{{outer}} does not contain {{expected}}",
} as const;

export type VerifierMessageIds = keyof typeof VerifierMessages;

/**
 * Removes directories from a path
 * @param pathOrFileName the input path or file name
 * @return the filename and extension
 */
export const stripPath = (pathOrFileName: string): string =>
  pathOrFileName.replace(/^.*[\\\/]/, "");

/**
 * Checks whether a package is ESM, given a file path that is at the root directory. For example,
 *    - /path/to/repository/packages/core/package.json
 * @param filePath the input path
 * @return true if the package has "type": "module"; false otherwise.
 */
export function isEsmPackage(filePath: string): boolean {
  const packageJsonPath = filePath.endsWith("package.json")
    ? filePath
    : path.join(path.dirname(filePath), "package.json");
  try {
    statSync(filePath);
    const packageJsonContent = readFileSync(packageJsonPath, "utf-8");
    const packageJson = JSON.parse(packageJsonContent);
    return packageJson["type"] === "module";
  } catch {
    return false;
  }
}
/**
 * Get the directory of a filename
 * @param pathOrFileName the input path or file name
 * @return the directory part of the path, with no trailing slash
 */
export const stripFileName = (pathOrFileName: string): string =>
  pathOrFileName.replace(/[\\\/][^\\\/]+$/, "");

/**
 * Converts an array to its literal string representation.
 * @param array the array in question.
 * @returns the array's string representation.
 */
export const arrayToString = (array: any[]): string => JSON.stringify(array).replace(/,/g, ", ");

/**
 * Returns structural verifiers given input
 * @param context provided ESLint context object
 * @param data matches StructureData interface, contains outer and optional inner and expected values
 * @return existsInFile, outerMatchesExpected, isMemberOf, innerMatchesExpected, and outerContainsExpected verifiers
 */
export const getVerifiers = (
  context: TSESLint.RuleContext<VerifierMessageIds, unknown[]>,
  data: StructureData,
): Verifiers => ({
  /**
   * check to see if if the outer key exists at the outermost level
   * @param node the ObjectExpression node we check to see if it contains data.outer as a key
   * @throws an ESLint report if node does not contain data.outer as a key
   */
  existsInFile: (node: TSESTree.ObjectExpression): void => {
    const outer = data.outer;

    const properties = node.properties;

    if (
      properties.every((value: TSESTree.Property | TSESTree.SpreadElement): unknown => {
        if (value.type === "Property") {
          const key = value.key as TSESTree.Literal;
          return key.value !== outer;
        }
        return false;
      })
    ) {
      context.report({
        node: node,
        messageId: "outerMostNotExist",
        data: { outer },
      });
    }
  },

  /**
   * check to see if the value of the outer key matches the expected value
   * @param node the Property node we want to check
   * @throws an ESlint report if node.value is not a literal or is not the expected value
   */
  outerMatchesExpected: (node: TSESTree.Property): void => {
    const outer = data.outer;
    const expected = data.expected;

    // check to see that node value is a Literal before casting
    if (node.value.type !== "Literal") {
      context.report({
        node: node.value,
        messageId: "notALiteral",
        data: { expression: outer },
      });
    }

    const nodeValue = node.value as TSESTree.Literal;

    // check node value against expected value
    if (nodeValue.value !== expected) {
      context.report({
        node: nodeValue,
        messageId: "actualNotExpected",
        data: {
          expression: outer,
          expected,
          actual: nodeValue.value,
        },
        fix: (fixer: TSESLint.RuleFixer): TSESLint.RuleFix =>
          fixer.replaceText(
            nodeValue,
            typeof expected === "string" ? `"${expected}"` : (expected as string),
          ),
      });
    }
  },

  /**
   * check that the inner key is a member of the outer key
   * @param node the Property node corresponding to the outer key
   * @throws an ESLint report if the inner key is not a member of the outer key's value
   */
  isMemberOf: (node: TSESTree.Property): void => {
    const outer = data.outer;
    const inner = data.inner;

    const value = node.value as TSESTree.ObjectExpression;
    const properties = value.properties;

    if (
      properties.every((value: TSESTree.Property | TSESTree.SpreadElement): unknown => {
        if (value.type === "Property") {
          const key = value.key as TSESTree.Literal;
          return key.value !== inner;
        }
        return false;
      })
    ) {
      context.report({
        node: value,
        messageId: "notMemberOf",
        data: { inner, outer },
      });
    }
  },

  /**
   * check the node corresponding to the inner value to see if it is set to the expected value
   * @param node the Property node corresponding to the inner key
   * @throws an ESLint report if the inner value is not a literal or does not match the expected value
   */
  innerMatchesExpected: (node: TSESTree.Property): void => {
    const outer = data.outer;
    const inner = data.inner;
    const expected = data.expected;

    // check to see that node value is a Literal before casting
    if (node.value.type !== "Literal") {
      context.report({
        node: node.value,
        messageId: "notALiteral",
        data: { expression: `${outer}.${inner}` },
      });
    }

    const nodeValue = node.value as TSESTree.Literal;

    // check node value against expected value
    if (nodeValue.value !== expected) {
      context.report({
        node: nodeValue,
        messageId: "actualNotExpected",
        data: {
          expression: `${outer}.${inner}`,
          actual: nodeValue.value,
          expected,
        },
        fix: (fixer: TSESLint.RuleFixer): TSESLint.RuleFix =>
          fixer.replaceText(
            nodeValue,
            typeof expected === "string" ? `"${expected}"` : (expected as string),
          ),
      });
    }
  },

  /**
   * check the node corresponding to the inner value to see if it contains the expected value
   * @param node the Property node corresponding to the outer key
   * @throws an ESLint repot of the node's value is not an array of literals or does not contain the expectec value(s)
   */
  outerContainsExpected: (node: TSESTree.Property): void => {
    const outer = data.outer;
    const expected = data.expected;

    if (node.value.type !== "ArrayExpression") {
      context.report({
        node: node.value,
        messageId: "notArray",
        data: { outer },
      });
    }

    const nodeValue = node.value as TSESTree.ArrayExpression;

    const nonLiteral = nodeValue.elements.find(
      (element: any): boolean => element.type !== "Literal",
    );

    if (nonLiteral !== undefined && nonLiteral !== null) {
      context.report({
        node: nonLiteral,
        messageId: "arrayContainsNonLiteral",
        data: { array: outer },
      });
    }

    const candidateArray = nodeValue.elements as TSESTree.Literal[];
    const candidateValues = candidateArray.map(
      (candidate: TSESTree.Literal): unknown => candidate.value,
    );

    if (expected instanceof Array) {
      expected.forEach((value: unknown): void => {
        if (!candidateValues.includes(value)) {
          context.report({
            node: nodeValue,
            messageId: "notContain",
            data: {
              outer,
              expected: value,
            },
            fix: (fixer: TSESLint.RuleFixer): TSESLint.RuleFix => {
              candidateValues.push(value);
              return fixer.replaceText(nodeValue, arrayToString(candidateValues));
            },
          });
        }
      });
    } else {
      if (!candidateValues.includes(expected)) {
        context.report({
          node: nodeValue,
          messageId: "notContain",
          data: {
            outer,
            expected,
          },
          fix: (fixer: TSESLint.RuleFixer): TSESLint.RuleFix => {
            candidateValues.push(expected);
            return fixer.replaceText(nodeValue, arrayToString(candidateValues));
          },
        });
      }
    }
  },
});
