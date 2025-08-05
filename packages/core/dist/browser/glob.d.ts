import type { ElementOrArray } from "./types.js";
/**
 * Checks if a given filename matches any of the provided glob patterns.
 *
 * @param filename - The name of the file to test against the patterns.
 * @param patterns - A single glob pattern or an array of glob patterns to match against.
 * @returns A boolean indicating if the filename matches any of the patterns.
 */
export declare function isGlobMatch(filename: string, patterns: ElementOrArray<string>, options?: {
    matchBase?: boolean;
}): boolean;
//# sourceMappingURL=glob.d.ts.map