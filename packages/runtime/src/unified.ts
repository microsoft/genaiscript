import type { Root } from "mdast";
import { filenameOrFileToContent, genaiscriptDebug, WorkspaceFile } from "@genaiscript/core";
import type { Test, BuildVisitor } from "unist-util-visit";
import type { Processor } from "unified";
const dbg = genaiscriptDebug("mdast");

export async function mdastParse(file: string | WorkspaceFile): Promise<Root> {
  const content = filenameOrFileToContent(file);
  if (!content) return { type: "root", children: [] };

  dbg(`parse`);
  const { unified } = await import("unified");
  const { default: parse } = await import("remark-parse");

  const processor = unified().use(parse);
  await usePlugins(processor);
  const ast = processor.parse(content);
  return ast;
}

export async function mdastStringify(root: Root): Promise<string> {
  if (!root) return "";

  const { unified } = await import("unified");
  const { default: stringify } = await import("remark-stringify");

  const processor = unified();
  await usePlugins(processor);
  const ast = await processor.use(stringify).stringify(root);
  return ast;
}

async function usePlugins(processor: Processor<Root>) {
  const { default: directive } = await import("remark-directive");
  const { default: gfm } = await import("remark-gfm");
  const { default: github } = await import("remark-github");
  const { default: frontmatter } = await import("remark-frontmatter");
  const { default: math } = await import("remark-math");
  return processor.use(frontmatter).use(gfm).use(github).use(directive).use(math);
}

export async function unifiedVisit(
  root: Root,
  visitor: BuildVisitor<Root, Test>,
  options?: {
    check?: Test;
    reverse?: boolean;
  },
): Promise<void> {
  if (!root) return;

  const { check, reverse } = options || {};
  const { visit } = await import("unist-util-visit");
  return visit(root, check, visitor, reverse);
}
