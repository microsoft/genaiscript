/**
 * Attempts to parse an XML string or WorkspaceFile, returning a default value on failure.
 *
 * @param text - The XML string or WorkspaceFile to parse
 * @param defaultValue - The value to return if parsing fails
 * @param options - Optional configuration for the XML parser
 * @returns The parsed XML object or defaultValue if an error occurs
 */
export declare function XMLTryParse(
  text: string | WorkspaceFile,
  defaultValue?: any,
  options?: XMLParseOptions,
): any;
/**
 * Parses an XML string or WorkspaceFile into an object.
 *
 * @param text - The XML string or WorkspaceFile to parse. If a WorkspaceFile is provided, its content will be extracted.
 * @param options - Configuration options for the XML parser. These options are merged with the default parser settings.
 * @returns The parsed XML object.
 */
export declare function XMLParse(text: string | WorkspaceFile, options?: XMLParseOptions): any;
//# sourceMappingURL=xml.d.ts.map
