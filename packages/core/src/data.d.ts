import type { TraceOptions } from "./trace.js";
import type { CSVParseOptions, INIParseOptions, WorkspaceFile, XMLParseOptions } from "./types.js";
/**
 * Attempts to parse the provided file's content based on its detected format.
 *
 * @param file - The file to be parsed, containing filename, content, and encoding details.
 * @param options - Optional configuration for parsing, including trace and format-specific options.
 *   - Trace options: Includes settings for tracing during processing.
 *   - XML options: Includes configurations for XML parsing.
 *   - INI options: Includes configurations for INI parsing.
 *   - CSV options: Includes configurations for CSV parsing.
 * @returns Parsed data in the appropriate format based on the file extension, or `undefined` if the format is unsupported.
 */
export declare function dataTryParse(file: WorkspaceFile, options?: TraceOptions & XMLParseOptions & INIParseOptions & CSVParseOptions): Promise<any>;
//# sourceMappingURL=data.d.ts.map