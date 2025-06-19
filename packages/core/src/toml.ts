import { parse } from "toml";
import { unfence } from "./unwrappers";
import { filenameOrFileToContent } from "./unwrappers";

/**
 * Parses a TOML-formatted input into a structured JavaScript object.
 *
 * @param text - The input to parse. It can be a string containing TOML-formatted content
 * or a WorkspaceFile object. If a WorkspaceFile is provided, its content is extracted
 * using `filenameOrFileToContent`.
 *
 * @returns A deep copy of the parsed object, created using `structuredClone`.
 *
 * @throws Will throw an error if the input cannot be successfully parsed as TOML.
 */
export function TOMLParse(text: string | WorkspaceFile) {
  text = filenameOrFileToContent(text);
  // Remove TOML fences from the text
  // `unfence` is assumed to sanitize or format the text for parsing
  const cleaned = unfence(text, "toml");

  // Parse the cleaned TOML string using the `parse` function
  // If parsing succeeds, return the parsed object
  const res = parse(cleaned);
  return structuredClone(res);
}

// Function to safely parse TOML formatted text
// Accepts a string `text` and an optional `options` object with a `defaultValue`
// If parsing fails, it returns `defaultValue` instead of throwing an error
export function TOMLTryParse(text: string | WorkspaceFile, options?: { defaultValue?: any }) {
  try {
    return TOMLParse(text);
  } catch (e) {
    // If parsing throws an error, return the `defaultValue` provided in options
    // This provides a fallback mechanism for error scenarios
    return options?.defaultValue;
  }
}
