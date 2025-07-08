// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { Root } from "mdast";
import type { WorkspaceFile } from "@genaiscript/core";
import { checkRuntime, filenameOrFileToContent, genaiscriptDebug } from "@genaiscript/core";
import type { Processor } from "unified";
import remarkGitHubAlerts from "./remarkalerts.js";
const dbg = genaiscriptDebug("mdast");

export interface MdAstOptions {
  /**
   * GitHub Flavored Markdown (GFM) support. Default is true.
   */
  gfm?: boolean;

  /**
   * GitHub short links. Default is true.
   */
  github?: boolean;

  /**
   * Generic directive support. Default is true.
   */
  directive?: boolean;

  /**
   * KaTex or MathJax syntax. Default is true.
   */
  math?: boolean;

  /**
   * MDX support. Default is false.
   */
  mdx?: boolean;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/explicit-function-return-type
export async function mdast(options?: MdAstOptions) {
  checkRuntime();
  const _options: MdAstOptions = structuredClone(options || {});
  dbg(`mdast: %o`, _options);
  const { unified } = await import("unified");
  const { default: parse } = await import("remark-parse");
  const { inspect } = await import("unist-util-inspect");
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

  const mdastParse = async (file: string | WorkspaceFile): Promise<Root> => {
    const content = filenameOrFileToContent(file);
    if (!content) return { type: "root", children: [] };

    dbg(`parse`);

    const processor = unified().use(parse);
    usePlugins(processor, "parse");
    const ast = processor.parse(content);
    const processed = await processor.run(ast);
    return processed as Root;
  };

  const mdastStringify = (root: Root): string => {
    if (!root) return "";

    dbg(`stringify`);
    const processor = unified();
    usePlugins(processor, "stringify");
    const result = processor.use(stringify).stringify(root);
    
    // Post-process to unescape GitHub alert syntax
    // TODO better
    const unescapedResult = String(result).replace(/^> \\(\[!(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION)\])/gm, '> $1');
    
    return unescapedResult;
  };

  return Object.freeze({
    parse: mdastParse,
    stringify: mdastStringify,
    visit,
    visitParents,
    inspect,
    CONTINUE,
    EXIT,
    SKIP,
  });

  function usePlugins(p: Processor<Root>, phase: "parse" | "stringify"): void {
    p.use(frontmatter);
    if (_options.gfm !== false) {
      p.use(remarkGitHubAlerts);
      p.use(gfm);
    }
    if (_options.github !== false && phase === "stringify") {
      p.use(github);
    }
    if (_options.directive !== false) p.use(directive);
    if (_options.math !== false) p.use(math);
    // no comments in MDX files
    p.use(comments, {
      emit: true, // Emit comments as HTML
    });
    if (_options.mdx) p.use(mdx);
  }
}
