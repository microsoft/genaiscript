import type { TraceOptions } from "./trace.js";
import { type CancellationOptions } from "./cancellation.js";
import type { WorkspaceFile, WorkspaceGrepOptions } from "./types.js";
export type GrepResult = {
    type: "match" | "context" | "begin" | "end";
    data: {
        path: {
            text: string;
        };
        lines: {
            text: string;
        };
        line_number: number;
    };
}[];
/**
 * Executes a grep-like search across the workspace using ripgrep.
 *
 * @param pattern - The search pattern, either a string or a regular expression.
 * @param options - Optional settings to customize the search behavior:
 *   - `path`: Specifies one or more paths to search.
 *   - `glob`: Array of glob patterns to include or exclude files.
 *   - `readText`: When false, avoids reading file content.
 *   - `applyGitIgnore`: When false, bypasses .gitignore filtering.
 *   - Accepts other trace and workspace-specific options.
 * @returns An object containing:
 *   - `files`: List of files that matched the pattern.
 *   - `matches`: List of detailed matches including filenames and content with line numbers.
 */
export declare function grepSearch(pattern: string | RegExp, options?: TraceOptions & CancellationOptions & WorkspaceGrepOptions): Promise<{
    data: GrepResult;
    files: WorkspaceFile[];
    matches: WorkspaceFile[];
}>;
//# sourceMappingURL=grep.d.ts.map