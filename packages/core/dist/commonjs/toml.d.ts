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
export declare function TOMLParse(text: string | WorkspaceFile): any;
export declare function TOMLTryParse(
  text: string | WorkspaceFile,
  options?: {
    defaultValue?: any;
  },
): any;
//# sourceMappingURL=toml.d.ts.map
