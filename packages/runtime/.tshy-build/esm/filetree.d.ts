/**
 * GenAIScript supporting runtime
 * This module provides core functionality for text classification, data transformation,
 * PDF processing, and file system operations in the GenAIScript environment.
 */
import { type Awaitable, type ElementOrArray, type FileStats, type OptionsOrString, type WorkspaceFile, type WorkspaceGrepOptions } from "@genaiscript/core";
/**
 * Creates a tree representation of files in the workspace.
 *
 * @param glob - Glob pattern to match files.
 * @param options - Configuration options for tree generation.
 * @param options.query - Optional search query to filter files.
 * @param options.size - Whether to include file sizes in the output.
 * @param options.ignore - Patterns to exclude from the results.
 * @param options.frontmatter - Frontmatter fields to extract from markdown files. Only applies to markdown files.
 * @param options.preview - Custom function to generate file previews based on file and stats.
 * @returns A formatted string representing the file tree structure, including metadata and file sizes if specified.
 */
export declare function fileTree(glob: string, options?: WorkspaceGrepOptions & {
    query?: string | RegExp;
    size?: boolean;
    ignore?: ElementOrArray<string>;
    frontmatter?: OptionsOrString<"title" | "description" | "keywords" | "tags">[];
    preview?: (file: WorkspaceFile, stats: FileStats) => Awaitable<unknown>;
}): Promise<string>;
//# sourceMappingURL=filetree.d.ts.map