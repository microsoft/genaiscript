import type { Root } from "mdast";
import { WorkspaceFile } from "./types.js";
import { filenameOrFileToContent } from "./unwrappers.js";
import { genaiscriptDebug } from "./debug.js";
const dbg = genaiscriptDebug("md:remark");

export async function remarkParse(file: string | WorkspaceFile): Promise<Root> {
  const content = filenameOrFileToContent(file);
  if (!content) return { type: "root", children: [] };

  dbg(`parse`);
  const { unified } = await import("unified");
  const { default: parse } = await import("remark-parse");
  const { default: gfm } = await import("remark-gfm");
  const { default: github } = await import("remark-github");
  const { default: frontmatter } = await import("remark-frontmatter");

  const ast = unified().use(parse).use(frontmatter).use(gfm).use(github).parse(content);
  ast.type = "root";
  return ast;
}

export async function remarkStringify(root: Root): Promise<string> {
  if (!root) return "";

  const { unified } = await import("unified");
  const { default: stringify } = await import("remark-stringify");

  return unified().use(stringify).stringify(root);
}
