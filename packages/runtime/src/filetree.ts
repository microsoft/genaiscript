// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * GenAIScript supporting runtime
 * This module provides core functionality for text classification, data transformation,
 * PDF processing, and file system operations in the GenAIScript environment.
 */
import type {
  Awaitable,
  ElementOrArray,
  FileStats,
  OptionsOrString,
  WorkspaceFile,
  WorkspaceGrepOptions,
} from "@genaiscript/core";

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
export async function fileTree(
  glob: string,
  options?: WorkspaceGrepOptions & {
    query?: string | RegExp;
    size?: boolean;
    ignore?: ElementOrArray<string>;
    frontmatter?: OptionsOrString<"title" | "description" | "keywords" | "tags">[];
    preview?: (file: WorkspaceFile, stats: FileStats) => Awaitable<unknown>;
  },
): Promise<string> {
  const { frontmatter, preview, query, size, ignore, ...rest } = options || {};
  const readText = !!(frontmatter || preview);
  // TODO
  const files = query
    ? (await workspace.grep(query, glob, { ...rest, readText })).files
    : await workspace.findFiles(glob, {
        ignore,
        readText,
      });
  const tree = await buildTree(files);
  return renderTree(tree);

  type TreeNode = {
    filename: string;
    children?: TreeNode[];
    stats: FileStats;
    metadata: string;
  };
  async function buildTree(files: WorkspaceFile[]): Promise<TreeNode[]> {
    const root: TreeNode[] = [];

    for (const file of files) {
      const { filename } = file;
      const parts = filename.split(/[/\\]/);
      let currentLevel = root;
      for (let index = 0; index < parts.length; index++) {
        const part = parts[index];
        let node = currentLevel.find((n) => n.filename === part);
        if (!node) {
          const stats = await workspace.stat(filename);
          const metadata: unknown[] = [];
          if (frontmatter && /\.mdx?$/i.test(filename)) {
            const fm = parsers.frontmatter(file) || {};
            if (fm) {
              metadata.push(
                ...frontmatter
                  .map((field) => [field, fm[field]])
                  .filter(([, v]) => v !== undefined)
                  .map(([k, v]) => `${k}: ${JSON.stringify(v)}`),
              );
            }
          }
          if (preview) metadata.push(await preview(file, stats));
          node = {
            filename: part,
            metadata: metadata
              .filter((f) => f !== undefined)
              .map((s) => String(s))
              .map((s) => s.replace(/\n/g, " "))
              .join(", "),
            stats,
          };
          currentLevel.push(node);
        }
        if (index < parts.length - 1) {
          if (!node.children) {
            node.children = [];
          }
          currentLevel = node.children;
        }
      }
    }

    return root;
  }

  function renderTree(nodes: TreeNode[], prefix = ""): string {
    return nodes
      .map((node, index) => {
        const isLast = index === nodes.length - 1;
        const newPrefix = prefix + (isLast ? "  " : "│ ");
        const children = node.children?.length ? renderTree(node.children, newPrefix) : "";
        const meta = [size ? `${Math.ceil(node.stats.size / 1000)}kb ` : undefined, node.metadata]
          .filter((s) => !!s)
          .join(", ");
        return `${prefix}${isLast ? "└ " : "├ "}${node.filename}${meta ? ` - ${meta}` : ""}\n${children}`;
      })
      .join("");
  }
}
