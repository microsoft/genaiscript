// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { Root } from "mdast";
import type { WorkspaceFile } from "@genaiscript/core";
import { checkRuntime, filenameOrFileToContent, genaiscriptDebug } from "@genaiscript/core";
import type { Processor } from "unified";
const dbg = genaiscriptDebug("mdast");

export async function mdast() {
  checkRuntime();

  dbg(`loading plugins`);
  const { unified } = await import("unified");
  const { default: parse } = await import("remark-parse");
  const { default: directive } = await import("remark-directive");
  const { default: gfm } = await import("remark-gfm");
  const { default: github } = await import("remark-github");
  const { default: frontmatter } = await import("remark-frontmatter");
  const { default: math } = await import("remark-math");
  const { default: mdx } = await import("remark-mdx");
  const { default: stringify } = await import("remark-stringify");
  const { default: comments } = await import("@slorber/remark-comment");
  const { visit, CONTINUE, EXIT, SKIP } = await import("unist-util-visit");
  const { visitParents } = await import("unist-util-visit-parents");
  await import("mdast-util-mdxjs-esm");

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
    return processor
      .use(frontmatter)
      .use(gfm)
      .use(github)
      .use(directive)
      .use(math)
      .use(mdx)
      .use(comments, {
        emit: true, // Emit comments as HTML
      });
  }

  return Object.freeze({
    parse: mdastParse,
    stringify: mdastStringify,
    visit,
    visitParents,
    CONTINUE,
    EXIT,
    SKIP,
  });
}
