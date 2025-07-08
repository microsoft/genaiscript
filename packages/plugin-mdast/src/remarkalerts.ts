// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { Plugin } from "unified";
import type { Root, Paragraph, Text, Blockquote, Data } from "mdast";
import { visit } from "unist-util-visit";
import { genaiscriptDebug } from "@genaiscript/core";
const dbg = genaiscriptDebug("mdast:gh-alerts");

/**
 * GitHub alert types supported by the plugin
 */
export type GitHubAlertType = "NOTE" | "TIP" | "IMPORTANT" | "WARNING" | "CAUTION";

/**
 * Extended data interface for GitHub alerts
 */
export interface GitHubAlertNodeData extends Data {
  githubAlert?: {
    type: GitHubAlertType;
    role?: "syntax" | "content";
  };
}

/**
 * Extended blockquote interface with GitHub alert data
 */
export interface GitHubAlertBlockquote extends Blockquote {
  data?: GitHubAlertNodeData;
}

/**
 * Interface for GitHub alert data
 */
export interface GitHubAlertData {
  type: GitHubAlertType;
  content: string;
}

/**
 * Options for the remark GitHub alerts plugin
 */
export interface RemarkGitHubAlertsOptions {
  // Reserved for future options
}

/**
 * Regular expression to match GitHub alert syntax
 * Matches: [!NOTE], [!TIP], [!IMPORTANT], [!WARNING], [!CAUTION]
 */
const GITHUB_ALERT_REGEX = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i;

/**
 * Remark plugin that parses GitHub alerts and splits paragraph content into multiple text nodes.
 *
 * GitHub alerts use the syntax:
 * > [!NOTE]
 * > This is a note alert
 *
 * This plugin detects these patterns in the first paragraph of blockquotes and splits
 * the content to separate the alert type from the alert content.
 *
 * @param options Plugin options
 * @returns Unified plugin transformer
 */
const remarkGitHubAlerts: Plugin<[RemarkGitHubAlertsOptions?], Root> = (options = {}) => {
  dbg(`registering`);
  return (tree: Root) => {
    visit(tree, "blockquote", (node: GitHubAlertBlockquote) => {
      dbg("blockquote: %O", node);
      // Check if the first child is a paragraph
      const firstChild = node.children[0];
      if (!firstChild || firstChild.type !== "paragraph") {
        return;
      }
      dbg("blockquote: %O", node);

      const paragraph = firstChild as Paragraph;

      // Check if the first text node contains GitHub alert syntax
      const firstTextNode = paragraph.children?.[0] as Text;
      if (!firstTextNode || firstTextNode.type !== "text") {
        dbg("No text node found");
        return;
      }

      dbg("text: %s", firstTextNode.value);
      const match = firstTextNode.value.match(GITHUB_ALERT_REGEX);
      dbg("Regex match: %O", match);

      if (!match) {
        dbg("No match found");
        return;
      }

      const alertType = match[1].toUpperCase() as GitHubAlertType;
      dbg("alert: %s", alertType);

      // Split the content
      const originalText = firstTextNode.value;
      const alertSyntax = match[0];
      const remainingContent = originalText.substring(alertSyntax.length);

      // Create new text nodes - always preserve syntax
      const newNodes: Text[] = [];

      // Keep the alert syntax as a separate text node
      newNodes.push({
        type: "text",
        value: alertSyntax,
        data: {
          githubAlert: {
            type: alertType,
            role: "syntax",
          },
        } as GitHubAlertNodeData,
      });

      // Add the content as a separate text node
      if (remainingContent) {
        newNodes.push({
          type: "text",
          value: remainingContent,
          data: {
            githubAlert: {
              type: alertType,
              role: "content",
            },
          } as GitHubAlertNodeData,
        });
      }

      // Add any remaining children from the paragraph
      const remainingChildren = paragraph.children.slice(1);

      // Update the paragraph with the new structure
      paragraph.children = [...newNodes, ...remainingChildren];

      // Add metadata to the blockquote node
      const nodeData = node.data || ({} as GitHubAlertNodeData);
      nodeData.githubAlert = {
        type: alertType,
      };
      Object.assign(node, { data: nodeData });
      dbg("Updated:", node);
    });
  };
};

export default remarkGitHubAlerts;
