/**
 * @file Helper methods for rules pertaining to JSON object structure
 */
import { TSESTree, TSESLint } from "@typescript-eslint/utils";
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
export declare const VerifierMessages: {
    readonly outerMostNotExist: "{{outer}} does not exist at the outermost level";
    readonly notMemberOf: "{{inner}} is not a member of {{outer}}";
    readonly notALiteral: "{{expression}} is not set to a literal (string | boolean | null | number | RegExp)";
    readonly actualNotExpected: "{{expression}} is set to {{actual}} when it should be set to {{expected}}";
    readonly notArray: "{{outer}} is not set to an array";
    readonly arrayContainsNonLiteral: "{{array}} contains non-literal (string | boolean | null | number | RegExp) elements";
    readonly notContain: "{{outer}} does not contain {{expected}}";
};
export type VerifierMessageIds = keyof typeof VerifierMessages;
/**
 * Removes directories from a path
 * @param pathOrFileName the input path or file name
 * @return the filename and extension
 */
export declare const stripPath: (pathOrFileName: string) => string;
/**
 * Checks whether a package is ESM, given a file path that is at the root directory. For example,
 *    - /path/to/repository/packages/core/package.json
 * @param filePath the input path
 * @return true if the package has "type": "module"; false otherwise.
 */
export declare function isEsmPackage(filePath: string): boolean;
/**
 * Get the directory of a filename
 * @param pathOrFileName the input path or file name
 * @return the directory part of the path, with no trailing slash
 */
export declare const stripFileName: (pathOrFileName: string) => string;
/**
 * Converts an array to its literal string representation.
 * @param array the array in question.
 * @returns the array's string representation.
 */
export declare const arrayToString: (array: any[]) => string;
/**
 * Returns structural verifiers given input
 * @param context provided ESLint context object
 * @param data matches StructureData interface, contains outer and optional inner and expected values
 * @return existsInFile, outerMatchesExpected, isMemberOf, innerMatchesExpected, and outerContainsExpected verifiers
 */
export declare const getVerifiers: (context: TSESLint.RuleContext<VerifierMessageIds, unknown[]>, data: StructureData) => Verifiers;
export {};
//# sourceMappingURL=verifiers.d.ts.map