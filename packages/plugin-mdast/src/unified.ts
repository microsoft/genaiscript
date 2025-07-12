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

  const mdastStringify = (root: Root | RootContent[], stringifyOptions?: object): string => {
    if (!root) return "";

    dbg(`stringify`);
    const processor = unified();
    usePlugins(processor, "stringify");
    // @ts-expect-error - TypeScript doesn't recognize the handlers option
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
    });

    const n = Array.isArray(root) ? ({ type: "root", children: root } satisfies Root) : root;
    const result = processor.stringify(n);
    return String(result);
  };

  const mdChunk = (
    nodes: Root | RootContent[],
    maxTokens: number,
    chunkOptions?: {
      tokenize: (text: string) => number;
    },
  ): RootContent[][] => {
    const { tokenize = approximateTokens } = chunkOptions || {};
    if (!nodes) return [];
    if (!Array.isArray(nodes)) {
      if (nodes.type !== "root") throw new Error("Expected nodes to be an array or a Root type");
      nodes = nodes.children || [];
    }
    if (nodes.length === 0) return [];

    const chunks: RootContent[][] = [];
    let currentChunk: RootContent[] = [];
    let currentTokenCount = 0;

    const measure = (ns: RootContent[]): number => tokenize(mdastStringify(ns));

    // Process nodes in order, never reordering them
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const nodeTokens = measure([node]);

      // If adding this node would exceed the limit and we have content in current chunk
      if (currentTokenCount + nodeTokens > maxTokens && currentChunk.length > 0) {
        // For headings, try to keep them with their content by looking ahead
        if (node.type === "heading") {
          // Look ahead to see how much content follows this heading
          let headingContentSize = nodeTokens;
          let nextHeadingIndex = i + 1;

          // Find content that belongs to this heading (until next heading of same or higher level)
          while (nextHeadingIndex < nodes.length) {
            const nextNode = nodes[nextHeadingIndex];
            if (nextNode.type === "heading" && nextNode.depth <= node.depth) {
              break; // Found a heading of same or higher level
            }
            headingContentSize += measure([nextNode]);
            nextHeadingIndex++;
          }

          // If the heading + its content can fit in a new chunk, start a new chunk
          if (headingContentSize <= maxTokens) {
            chunks.push(currentChunk);
            currentChunk = [];
            currentTokenCount = 0;
          }
          // Otherwise, just finalize current chunk and continue
          else if (currentChunk.length > 0) {
            chunks.push(currentChunk);
            currentChunk = [];
            currentTokenCount = 0;
          }
        } else {
          // For non-heading nodes, just start a new chunk
          chunks.push(currentChunk);
          currentChunk = [];
          currentTokenCount = 0;
        }
      }

      // Add the current node to the chunk
      currentChunk.push(node);
      currentTokenCount += nodeTokens;

      // If this single node exceeds maxTokens, put it in its own chunk
      if (nodeTokens > maxTokens && currentChunk.length === 1) {
        chunks.push(currentChunk);
        currentChunk = [];
        currentTokenCount = 0;
      }
    }

    // Add final chunk if it has content
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    return chunks;
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
