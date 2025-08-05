"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
const unist_util_visit_1 = require("unist-util-visit");
const core_1 = require("@genaiscript/core");
const dbg = (0, core_1.genaiscriptDebug)("mdast:gfm:alerts");
/**
 * Regular expression to match GitHub alert syntax
 * Matches: [!NOTE], [!TIP], [!IMPORTANT], [!WARNING], [!CAUTION]
 */
const GITHUB_ALERT_REGEX = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\n?/i;
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
const remarkGitHubAlerts = (options = {}) => {
    dbg(`registering`);
    return (tree) => {
        (0, unist_util_visit_1.visit)(tree, "blockquote", (node) => {
            dbg("blockquote: %O", node);
            // Check if the first child is a paragraph
            const firstChild = node.children[0];
            if (!firstChild || firstChild.type !== "paragraph") {
                return;
            }
            dbg("blockquote: %O", node);
            const paragraph = firstChild;
            // Check if the first text node contains GitHub alert syntax
            const firstTextNode = paragraph.children?.[0];
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
            const alertType = match[1].toUpperCase();
            dbg("alert: %s", alertType);
            // Split the content
            const originalText = firstTextNode.value;
            const alertSyntax = match[0];
            const remainingContent = originalText.substring(alertSyntax.length);
            // Create new text nodes - always preserve syntax
            const newNodes = [];
            // Keep the alert syntax as a separate text node
            newNodes.push({
                type: "githubAlertMarker",
                value: alertSyntax,
                data: {
                    githubAlert: {
                        type: alertType,
                        role: "syntax",
                    },
                },
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
                    },
                });
            }
            // Add any remaining children from the paragraph
            const remainingChildren = paragraph.children.slice(1);
            // Update the paragraph with the new structure
            paragraph.children = [...newNodes, ...remainingChildren];
            // Add metadata to the blockquote node
            const nodeData = node.data || {};
            nodeData.githubAlert = {
                type: alertType,
            };
            Object.assign(node, { data: nodeData });
            dbg("Updated:", node);
        });
    };
};
exports.default = remarkGitHubAlerts;
//# sourceMappingURL=remarkalerts.js.map