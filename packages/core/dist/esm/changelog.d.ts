export interface ChangeLogChunk {
    start: number;
    end: number;
    lines: {
        index: number;
        content: string;
    }[];
}
export interface ChangeLogChange {
    original: ChangeLogChunk;
    changed: ChangeLogChunk;
}
export interface ChangeLog {
    index: number;
    filename: string;
    description: string;
    changes: ChangeLogChange[];
}
/**
 * Parses a raw changelog string into a structured array of ChangeLog objects.
 *
 * @param source The raw input string containing changelog information.
 * Must include headers, descriptions, and detailed changes with line numbers and contents.
 * The input is expected to be wrapped in a "changelog" fence.
 * Throws an error if the format is invalid, required fields are missing, or parsing fails.
 *
 * @returns An array of ChangeLog objects parsed from the input.
 */
export declare function parseChangeLogs(source: string): ChangeLog[];
/**
 * Applies a changelog to a given source string, modifying it according to the changes.
 *
 * @param source The original source code as a string.
 * @param changelog The ChangeLog object containing the changes to apply. Updates line indices for subsequent changes.
 * @returns The modified source code as a string.
 */
export declare function applyChangeLog(source: string, changelog: ChangeLog): string;
//# sourceMappingURL=changelog.d.ts.map