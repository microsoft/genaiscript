import type { PromptScript, Diagnostic } from "./types.js";
/**
 * This module contains utility functions for working with SARIF (Static Analysis Results Interchange Format)
 * including checking file extensions and converting diagnostic issues to SARIF format.
 */
/**
 * Checks if the filename has a SARIF extension.
 * @param f - The filename to check.
 * @returns True if the filename ends with .sarif, false otherwise.
 */
export declare function isSARIFFilename(f: string): boolean;
/**
 * Converts diagnostic issues to a SARIF format.
 *
 * This function is intended to be used with the MS-SarifVSCode.sarif-viewer.
 *
 * @param template - The template containing script metadata, including id, title, and description.
 * @param issues - Array of diagnostic issues to convert. Each issue should include severity, message, filename, and range.
 * Each range is a tuple where the first element is the start position and the second element is the end position.
 * @returns A stringified SARIF JSON object representing the diagnostic issues, formatted with indentation for readability.
 */
export declare function convertDiagnosticsToSARIF(template: PromptScript, issues: Diagnostic[]): Promise<string>;
//# sourceMappingURL=sarif.d.ts.map