import type { Root } from "mdast";
import { filenameOrFileToContent, genaiscriptDebug, WorkspaceFile } from "@genaiscript/core";
import type { Test, BuildVisitor } from "unist-util-visit";
import type { Processor } from "unified";
const dbg = genaiscriptDebug("mdast");

export async function mdast() {
  dbg(`loading plugins`);
  const { unified } = await import("unified");
  const { default: parse } = await import("remark-parse");
  const { default: directive } = await import("remark-directive");
  const { default: gfm } = await import("remark-gfm");
  const { default: github } = await import("remark-github");
  const { default: frontmatter } = await import("remark-frontmatter");
  const { default: math } = await import("remark-math");
  const { default: stringify } = await import("remark-stringify");
  const { visit } = await import("unist-util-visit");

  function mdastParse(file: string | WorkspaceFile): Root {
    const content = filenameOrFileToContent(file);
    if (!content) return { type: "root", children: [] };

    dbg(`parse`);

    const processor = unified().use(parse);
    usePlugins(processor);
    const ast = processor.parse(content);
    return ast;
  }

  function mdastStringify(root: Root): string {
    if (!root) return "";

    dbg(`stringify`);
    const processor = unified();
    usePlugins(processor);
    const ast = processor.use(stringify).stringify(root);
    return ast;
  }

  function usePlugins(processor: Processor<Root>) {
    return processor.use(frontmatter).use(gfm).use(github).use(directive).use(math);
  }

  function mdastVisit(
    root: Root,
    check: Test,
    visitor: BuildVisitor<Root, Test>,
    reverse?: boolean,
  ): void {
    if (!root) return;

    dbg(`visit`);
    visit(root, check, visitor, reverse);
  }

  return Object.freeze({
    parse: mdastParse,
    stringify: mdastStringify,
    visit: mdastVisit,
  });
}
