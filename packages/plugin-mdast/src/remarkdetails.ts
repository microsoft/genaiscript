// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { Plugin } from "unified";
import type { Node, Root, Paragraph, Text, Blockquote, Data, Parent } from "mdast";
import { visit } from "unist-util-visit";
import { genaiscriptDebug } from "@genaiscript/core";
const dbg = genaiscriptDebug("mdast:html:details");

export interface RemarkDetailsOptions {}

export interface DetailsElement extends Parent {
  type: "detailsElement";
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
    visit(tree, "html", (node) => {
      // Regex to parse HTML details element with optional summary
      const detailsRegex =
        /^\s*<details(?:\s+[^>]*)?>(?:\s*<summary(?:\s+[^>]*)?>(?<summary>[^<]*)<\/summary>)?\s*(?<content>[\s\S]*?)\s*<\/details>\s*$/i;
      const match = node.value.match(detailsRegex);
      if (!match) return;

      dbg(`parsing %s`, node.value);
      const { summary, content } = match.groups;
      dbg(`summary: %s`, summary);

      const summaryNode: SummaryElement = summary
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
              } satisfies Text,
            ],
          }
        : undefined;
      const contentNode = content
        ? {
            type: "text",
            value: content,
          }
        : undefined;
      const detailsNode: DetailsElement = {
        type: "detailsElement",
        data: {
          detailsElement: {
            summary,
            content,
          },
        },
        children: [summaryNode, contentNode].filter(Boolean) as any[],
      };

      // TODO:
      // replace node with detailsNode in the tree
    });
  };
};

export default remarkDetails;
