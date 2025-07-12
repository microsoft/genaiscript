// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { Root, RootContent } from "mdast";
import type { WorkspaceFile } from "@genaiscript/core";
import { checkRuntime, filenameOrFileToContent, genaiscriptDebug } from "@genaiscript/core";
import type { Processor } from "unified";
import remarkGitHubAlerts from "./remarkalerts.js";
import type { GitHubAlertMarker } from "./remarkalerts.js";
import remarkDetails from "./remarkdetails.js";
import type { DetailsElement, SummaryElement } from "./remarkdetails.js";
import { approximateTokens } from "@genaiscript/core";
const dbg = genaiscriptDebug("mdast");

export interface MdAstOptions {
  /**
   * GitHub Flavored Markdown (GFM) support. Default is true.
   */
  gfm?: boolean;

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
  const { default: frontmatter } = await import("remark-frontmatter");
  const { default: math } = await import("remark-math");
  const { default: mdx } = await import("remark-mdx");
  const { default: stringify } = await import("remark-stringify");
  const { default: comments } = await import("@slorber/remark-comment");
  const { visit, CONTINUE, EXIT, SKIP } = await import("unist-util-visit");
  const { visitParents } = await import("unist-util-visit-parents");
  await import("mdast-util-mdxjs-esm");

  const mdastParse = (file: string | WorkspaceFile): Root => {
    const content = filenameOrFileToContent(file);
    if (!content) return { type: "root", children: [] };

    dbg(`parse`);

    const processor = unified().use(parse);
    usePlugins(processor, "parse");
    const ast = processor.parse(content);
    const processed = processor.runSync(ast);
    return processed as Root;
  };

  const mdastStringify = (root: Root, stringifyOptions?: object): string => {
    if (!root) return "";

    dbg(`stringify`);
    const processor = unified();
    usePlugins(processor, "stringify");
    processor.use(stringify, {
      ...(stringifyOptions || {}),
      handlers: {
        githubAlertMarker(node: GitHubAlertMarker) {
          return node.value;
        },
        detailsElement(node: DetailsElement) {
          return `<details ${node.attributes || ""}>${node.children.map((child) => processor.stringify(child)).join("")}</details>`;
        },
        summaryElement(node: SummaryElement) {
          return `<summary>${node.children.map((child) => processor.stringify(child)).join("")}</summary>`;
        },
      },
    } as any);

    const result = processor.stringify(root);
    return String(result);
  };

  const mdChunk = (
    nodes: RootContent[],
    maxTokens: number,
    chunkOptions?: {
      tokenize: (text: string) => number;
    },
  ): RootContent[][] => {
    const { tokenize = approximateTokens } = chunkOptions || {};
    const res: RootContent[][] = [];
    let currentChunk: RootContent[] = [];
    let currentTokenCount = 0;

    for (const node of nodes) {
      const nodeText = mdastStringify({ type: "root", children: [node] });
      const nodeTokenCount = tokenize(nodeText);

      if (currentTokenCount + nodeTokenCount > maxTokens) {
        res.push(currentChunk);
        currentChunk = [];
        currentTokenCount = 0;
      }

      currentChunk.push(node);
      currentTokenCount += nodeTokenCount;
    }

    if (currentChunk.length > 0) {
      res.push(currentChunk);
    }

    return res;
  };

  return Object.freeze({
    parse: mdastParse,
    stringify: mdastStringify,
    chunk: mdChunk,
    visit,
    visitParents,
    inspect,
    CONTINUE,
    EXIT,
    SKIP,
  });

  function usePlugins(p: Processor<Root>, phase: "parse" | "stringify"): void {
    p.use(frontmatter);
    p.use(remarkDetails);
    if (_options.gfm !== false) {
      p.use(remarkGitHubAlerts);
      p.use(gfm);
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
