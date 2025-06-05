/**
 * Determines if a given filename has a JSONL-compatible extension.
 *
 * @param fn - The filename to evaluate.
 * @returns True if the filename ends with .jsonl, .mdjson, or .ldjson (case-insensitive), otherwise false.
 */
export declare function isJSONLFilename(fn: string): boolean;
/**
 * Parses a JSONL (JSON Lines) formatted string into an array of objects.
 *
 * @param text - The string containing JSONL data. If empty, an empty array is returned.
 * @param options - Optional. Contains parsing configuration:
 *   - repair: If true, attempts to repair invalid JSON during parsing.
 *
 * @returns An array of parsed objects. Lines that fail parsing or are empty are skipped.
 */
export declare function JSONLTryParse(
  text: string,
  options?: {
    repair?: boolean;
  },
): any[];
/**
 * Converts an array of objects into a JSON Lines (JSONL) formatted string.
 *
 * @param objs - The array of objects to be serialized. Objects that are undefined or null are excluded from the output.
 * @returns A string where each object in the array is serialized as a JSON string and separated by newlines. Returns an empty string if the input array is empty or null.
 */
export declare function JSONLStringify(objs: any[]): string;
/**
 * Writes a JSON Lines (JSONL) file. Overwrites the file if it already exists.
 *
 * @param fn - The name of the file to write.
 * @param objs - An array of objects to serialize and write to the file.
 */
export declare function writeJSONL(fn: string, objs: any[]): Promise<void>;
/**
 * Appends objects to a JSON Lines (JSONL) file. If metadata is provided, it will be added to each object before appending.
 *
 * @param name - The name of the JSONL file to append to.
 * @param objs - The objects to be appended to the file.
 * @param meta - Optional metadata to include in each appended object under the `__meta` key.
 */
export declare function appendJSONL<T>(name: string, objs: T[], meta?: any): Promise<void>;
//# sourceMappingURL=jsonl.d.ts.map
