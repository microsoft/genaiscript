import type { WorkspaceFile } from "./types.js";
/**
 * Changes the file extension of a given file name.
 *
 * @param filename - The name of the file whose extension needs to be changed.
 * @param newext - The new extension to apply. If it does not start with a dot, one will be added automatically.
 * @returns The file name with the updated extension.
 */
export declare function changeext(filename: string, newext: string): string;
/**
 * Reads the content of a specified file as text.
 *
 * @param fn - Path of the file to be read.
 * @returns The textual content of the file.
 */
export declare function readText(fn: string): Promise<string>;
/**
 * Attempts to read text content from a file. If the file cannot be read, returns undefined.
 *
 * @param fn - The path of the file to read.
 * @returns The content of the file as a string if successfully read, or undefined if an error occurs.
 */
export declare function tryReadText(fn: string): Promise<string>;
/**
 * Ensures that the specified directory exists.
 * Creates the directory and any necessary parent directories if they do not exist.
 *
 * @param dir - The path of the directory to ensure exists.
 */
export declare function ensureDir(dir: string): Promise<void>;
/**
 * Expands homedir
 */
export declare function expandHomeDir(dir: string): string;
/**
 * Writes text content to a specified file, creating directories if necessary.
 *
 * @param fn - The path of the file to write to. Directories in the path will be created if they do not exist.
 * @param content - The textual content to write into the file.
 */
export declare function writeText(fn: string, content: string): Promise<void>;
/**
 * Appends text content to the end of the specified file, creating directories as needed.
 *
 * @param fn - Path to the file where content will be appended. Must be provided.
 * @param content - Text content to append to the file.
 * @throws Throws an error if the filename is not provided.
 */
export declare function appendText(fn: string, content: string): Promise<void>;
/**
 * Checks if a file exists at the given path.
 *
 * @param fn - The path to the file to check.
 * @returns A promise that resolves to `true` if the file exists and is a file, or `false` otherwise.
 */
export declare function fileExists(fn: string): Promise<boolean>;
/**
 * Attempts to retrieve the file status for a given file path.
 * If an error occurs (e.g., the file does not exist), it returns undefined.
 *
 * @param fn - The path of the file to retrieve the status for. If not provided, returns undefined.
 * @returns The file status object if the file exists, or undefined if it does not.
 */
export declare function tryStat(fn: string): Promise<import("fs").Stats>;
export declare function rmDir(dir: string): Promise<void>;
/**
 * Reads and parses a JSON file from the specified path.
 *
 * @param fn - The path to the JSON file to be read.
 * @returns The parsed JSON object from the file.
 * @throws Throws an error if the file cannot be read or parsed as JSON.
 */
export declare function readJSON(fn: string): Promise<any>;
/**
 * Tries to read and parse a JSON object from a file.
 *
 * @param fn - Path to the file to be read.
 * @returns The parsed JSON object if the operation succeeds, or `undefined` if an error occurs.
 */
export declare function tryReadJSON(fn: string): Promise<any>;
export declare function tryReadJSON5(fn: string): Promise<unknown>;
/**
 * Writes a JSON object to a file.
 *
 * @param fn - The path to the file where the JSON object will be written.
 * @param obj - The JSON object to be written to the file.
 */
export declare function writeJSON(fn: string, obj: unknown): Promise<void>;
/**
 * Expands given file paths into a list of file paths and URLs, applying optional filtering and processing.
 *
 * @param files - An array of file paths or URLs to process.
 * @param options - Optional parameters for filtering and processing.
 *   @param excludedFiles - A list of file paths or URLs to exclude from the result.
 *   @param accept - A comma-separated list of file extensions to include (e.g., ".js,.ts").
 *   @param applyGitIgnore - Whether to apply `.gitignore` rules during file discovery.
 * @returns An array of expanded file paths and URLs, filtered based on the given options.
 */
export declare function expandFiles(files: string[], options?: {
    excludedFiles?: string[];
    accept?: string;
    applyGitIgnore?: boolean;
}): Promise<string[]>;
/**
 * Expands a list of files or workspace files into a unified list of workspace files.
 *
 * @param files - Array of file paths or workspace file objects to process.
 *   - Strings in the array represent file paths.
 *   - Objects in the array represent workspace files.
 * @returns A Promise resolving to an array of workspace file objects.
 *
 * The function separates file paths and workspace file objects from the input, processes the file paths
 * through `expandFiles` to resolve all matching paths, and combines the results with the workspace file objects.
 */
export declare function expandFileOrWorkspaceFiles(files: (string | WorkspaceFile)[]): Promise<WorkspaceFile[]>;
/**
 * Converts a file path or URL into a workspace-friendly file path.
 *
 * @param f - The file path or URL to convert. If the input is a valid HTTPS URL or an absolute file path as resolved by the host, it is returned as-is. Otherwise, the path is prefixed with `./` to create a relative path.
 * @returns The workspace-compatible file path or URL.
 */
export declare function filePathOrUrlToWorkspaceFile(f: string): string;
//# sourceMappingURL=fs.d.ts.map