"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
const unist_util_visit_1 = require("unist-util-visit");
const remark_1 = require("remark");
const core_1 = require("@genaiscript/core");
const dbg = (0, core_1.genaiscriptDebug)("mdast:html:details");
const remarkDetails = (options = {}) => {
    return (tree) => {
        (0, unist_util_visit_1.visit)(tree, "html", (node, index, parent) => {
            // Regex to parse HTML details element with optional summary
            const detailsRegex = /^\s*<details(?<attributes>\s+[^>]*)?>(?:\s*<summary(?:\s+[^>]*)?>(?<summary>[^<]*)<\/summary>)?\s*(?<content>[\s\S]*?)\s*<\/details>\s*$/i;
            const match = node.value.match(detailsRegex);
            if (!match)
                return undefined;
            dbg(`parsing %s`, node.value);
            const { attributes, summary, content } = match.groups;
            dbg(`summary: %s`, summary);
            dbg(`content: %s`, content?.slice(0, 100));
            // Parse content as markdown if it exists
            let contentNodes = [];
            if (content) {
                try {
                    const contentTree = (0, remark_1.remark)().parse(content.trim());
                    contentNodes = contentTree?.children;
                }
                catch (error) {
                    dbg(`failed to parse content as markdown: %s`, error);
                    // Fallback to text node
                    contentNodes = [
                        {
                            type: "text",
                            value: content,
                        },
                    ];
                }
            }
            const summaryNode = summary
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
                        },
                    ],
                }
                : undefined;
            const detailsNode = {
                type: "detailsElement",
                attributes,
                data: {
                    detailsElement: {
                        summary: summary,
                        content: content,
                    },
                },
                children: [summaryNode, ...contentNodes].filter(Boolean),
            };
            // Replace the HTML node with the details node
            if (parent && typeof index === "number") {
                // eslint-disable-next-line no-param-reassign
                parent.children[index] = detailsNode;
                return [unist_util_visit_1.SKIP, index];
            }
            dbg(`failed to replace node`);
            return undefined;
        });
    };
};
exports.default = remarkDetails;
//# sourceMappingURL=remarkdetails.js.map