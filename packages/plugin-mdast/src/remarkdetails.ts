// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { Plugin } from "unified";
import type { Node, Root, Paragraph, Text, Blockquote, Data, Parent, RootContent } from "mdast";
import { visit, SKIP } from "unist-util-visit";
import { remark } from "remark";
import { genaiscriptDebug } from "@genaiscript/core";
const dbg = genaiscriptDebug("mdast:html:details");

export interface RemarkDetailsOptions {}

export interface DetailsElement extends Parent {
  type: "detailsElement";
  attributes?: string;
  data?: Data & {
    detailsElement?: {
      summary: string;
      content: string;
    };
  };
}

export interface SummaryElement extends Parent {
  type: "summaryElement";
  data?: Data & {
    summaryElement?: {
      text: string;
    };
  };
}

const remarkDetails: Plugin<[RemarkDetailsOptions?], Root> = (options = {}) => {
  return (tree) => {
    visit(tree, "html", (node, index, parent) => {
      // Regex to parse HTML details element with optional summary
      const detailsRegex =
        /^\s*<details(?<attributes>\s+[^>]*)?>(?:\s*<summary(?:\s+[^>]*)?>(?<summary>[^<]*)<\/summary>)?\s*(?<content>[\s\S]*?)\s*<\/details>\s*$/i;
      const match = node.value.match(detailsRegex);
      if (!match) return undefined;

      dbg(`parsing %s`, node.value);
      const { attributes, summary, content } = match.groups;
      dbg(`summary: %s`, summary);
      dbg(`content: %s`, content?.slice(0, 100));

      // Parse content as markdown if it exists
      let contentNodes: RootContent[] = [];
      if (content) {
        try {
          const contentTree = remark().parse(content.trim());
          contentNodes = contentTree?.children;
        } catch (error) {
          dbg(`failed to parse content as markdown: %s`, error);
          // Fallback to text node
          contentNodes = [
            {
              type: "text",
              value: content,
            } satisfies Text,
          ];
        }
      }

      const summaryNode: SummaryElement | undefined = summary
        ? {
            type: "summaryElement",
            data: {
              summaryElement: {
                text: summary,
              },
            },
            children: [
              {
                type: "text",
                value: summary,
              } as Text,
            ],
          }
        : undefined;

      const detailsNode: DetailsElement = {
        type: "detailsElement",
        attributes,
        data: {
          detailsElement: {
            summary: summary,
            content: content,
          },
        },
        children: [summaryNode, ...contentNodes].filter(Boolean) as RootContent[],
      };

      // Replace the HTML node with the details node
      if (parent && typeof index === "number") {
        // eslint-disable-next-line no-param-reassign
        parent.children[index] = detailsNode as any;
        return [SKIP, index];
      }

      dbg(`failed to replace node`);
      return undefined;
    });
  };
};

export default remarkDetails;
