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

  const mdastStringify = (root: Root | Node[], stringifyOptions?: object): string => {
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

    const n = Array.isArray(root) ? { type: "root", children: root } : root;
    const result = processor.stringify(n);
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

    if (nodes.length === 0) return [];

    // Group nodes by heading sections
    const sections: { heading?: RootContent; content: RootContent[]; level: number }[] = [];
    let currentSection: { heading?: RootContent; content: RootContent[]; level: number } | null =
      null;

    for (const node of nodes) {
      if (node.type === "heading") {
        // Start a new section
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          heading: node,
          content: [],
          level: node.depth || 1,
        };
      } else {
        // Add to current section or create a default section
        if (!currentSection) {
          currentSection = {
            content: [],
            level: 0,
          };
        }
        currentSection.content.push(node);
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    // Now chunk sections based on token limits
    const chunks: RootContent[][] = [];
    let currentChunk: RootContent[] = [];
    let currentTokenCount = 0;

    const getNodeTokens = (ns: RootContent[]): number => {
      const text = mdastStringify({ type: "root", children: ns });
      return tokenize(text);
    };

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionNodes = section.heading
        ? [section.heading, ...section.content]
        : section.content;
      const sectionTokens = getNodeTokens(sectionNodes);

      // If section is too large, put it in its own chunk(s)
      if (sectionTokens > maxTokens) {
        // Finalize current chunk if it has content
        if (currentChunk.length > 0) {
          chunks.push(currentChunk);
          currentChunk = [];
          currentTokenCount = 0;
        }

        // Handle oversized section by splitting it node by node
        if (section.heading) {
          const headingTokens = getNodeTokens([section.heading]);
          if (headingTokens <= maxTokens) {
            currentChunk.push(section.heading);
            currentTokenCount = headingTokens;
          } else {
            // Even heading is too large, put it alone
            chunks.push([section.heading]);
          }
        }

        // Add content nodes one by one
        for (const contentNode of section.content) {
          const nodeTokens = getNodeTokens([contentNode]);

          if (currentTokenCount + nodeTokens > maxTokens) {
            if (currentChunk.length > 0) {
              chunks.push(currentChunk);
              currentChunk = [];
              currentTokenCount = 0;
            }
          }

          currentChunk.push(contentNode);
          currentTokenCount += nodeTokens;
        }
      } else {
        // Check if adding this section would exceed limit
        if (currentTokenCount + sectionTokens > maxTokens) {
          // Try to backtrack nested sections if current section is at deeper level
          const removedSections: RootContent[] = [];
          let j = currentChunk.length - 1;

          while (
            j >= 0 &&
            currentTokenCount + sectionTokens > maxTokens &&
            currentChunk.length > 0
          ) {
            const lastNode = currentChunk[j];
            if (lastNode.type === "heading") {
              const lastLevel = lastNode.depth || 1;
              if (lastLevel > section.level) {
                // Remove this heading and subsequent content until next heading of same or higher level
                let k = j;
                while (k < currentChunk.length) {
                  const removedNode = currentChunk.splice(k, 1)[0];
                  removedSections.unshift(removedNode);
                  if (k < currentChunk.length && currentChunk[k]?.type === "heading") {
                    const nextLevel = currentChunk[k].depth || 1;
                    if (nextLevel <= section.level) break;
                  }
                }
                currentTokenCount = getNodeTokens(currentChunk);
              } else {
                break;
              }
            } else {
              j--;
            }
          }

          // If we still can't fit, finalize current chunk
          if (currentTokenCount + sectionTokens > maxTokens && currentChunk.length > 0) {
            chunks.push(currentChunk);
            currentChunk = [...removedSections];
            currentTokenCount = getNodeTokens(currentChunk);
          } else if (removedSections.length > 0) {
            // Add back removed sections to current chunk
            currentChunk.push(...removedSections);
            currentTokenCount = getNodeTokens(currentChunk);
          }
        }

        // Add the section to current chunk
        currentChunk.push(...sectionNodes);
        currentTokenCount += sectionTokens;
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
