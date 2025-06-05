import { TraceOptions } from "./trace.js";
/**
 * Parses a DOCX file and converts its content to text, HTML, or markdown format. Uses Mammoth for processing.
 *
 * @param file - The DOCX file to parse, either as a path string or a WorkspaceFile object.
 * @param options - Optional parameters including trace for logging, cache control, and output format (default is "markdown"). If cache is enabled, attempts to retrieve cached results.
 * @returns An object containing the parsed file content or an error message in case of failure. If caching is enabled and an error occurs, attempts to return cached results.
 */
export declare function DOCXTryParse(
  file: string | WorkspaceFile,
  options?: TraceOptions & DocxParseOptions,
): Promise<{
  file?: WorkspaceFile;
  error?: string;
}>;
//# sourceMappingURL=docx.d.ts.map
