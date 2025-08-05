import type { WorkspaceFileSystem } from "./types.js";
/**
 * Creates a file system interface for interacting with workspace files.
 *
 * @returns An object implementing the WorkspaceFileSystem functionalities, excluding "grep" and "writeCached".
 *
 * Functions:
 * - `findFiles(glob, options)`: Searches for files matching a glob pattern. Filters out `.env` files and adheres to gitignore settings. The `options` object can include:
 *   - `readText`: Whether to read file contents (default: true).
 *   - `ignore`: Patterns to ignore during the search.
 *   - `applyGitIgnore`: Whether to apply gitignore rules (default: true).
 * - `writeText(filename, c)`: Writes `c` (content) to the specified `filename`. Throws error if writing to `.env` files.
 * - `appendText(filename, c)`: Appends `c` (content) to the specified `filename`. Throws error if writing to `.env` files.
 * - `readText(f)`: Reads the content of a file or a WorkspaceFile object. Throws if the file name is missing.
 * - `readJSON(f, options)`: Reads and parses JSON content from the given file or WorkspaceFile. Optionally validates with a schema.
 * - `readYAML(f, options)`: Reads and parses YAML content from the given file or WorkspaceFile. Optionally validates with a schema.
 * - `readXML(f, options)`: Reads and parses XML content from the given file or WorkspaceFile. The `options` parameter supports parsing configuration and schema validation.
 * - `readCSV(f, options)`: Reads and parses CSV content into an array of objects. Accepts `options` for CSV parsing customization and schema validation.
 * - `readINI(f, options)`: Reads and parses INI content into an object. Accepts `options` for default value configuration and parsing, and schema validation.
 * - `readData(f, options)`: Reads a generic data file and applies parsing logic. Optionally validates with a schema.
 * - `cache(name)`: Retrieves a JSON line-based cache by `name`. Throws error if `name` is missing.
 * - `stat(filename)`: Retrieves the size and mode (permissions) of the specified file. Returns `undefined` if the file does not exist.
 * - `copyFile(src, dest)`: Copies a file from `src` to `dest`. Throws error if `.env` files are involved.
 * - `writeFiles(files)`: Writes a batch of WorkspaceFile objects to the file system. Supports encoding (e.g., base64) if specified.
 */
export declare function createWorkspaceFileSystem(): Omit<WorkspaceFileSystem, "grep" | "writeCached">;
//# sourceMappingURL=workspace.d.ts.map