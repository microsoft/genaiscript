// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { details } from "./mkmd.js";

// Interface representing an item node in a trace tree
export interface ItemNode {
  id?: string; // Optional unique identifier
  type: "item";
  label: string; // Label for the item
  value: string; // Value of the item
}

// Interface representing a details node containing trace nodes
export interface DetailsNode {
  id?: string; // Optional unique identifier
  type: "details";
  label: string; // Label for the details node
  content: TraceNode[]; // Array of trace nodes contained
  open?: boolean; // Optional flag to indicate if the details node is open
}

// Type representing possible trace nodes which can be strings, details nodes, or item nodes
export type TraceNode = string | DetailsNode | ItemNode;

// Interface representing a trace tree structure
export interface TraceTree {
  root: DetailsNode; // Root node of the trace tree
  nodes: Record<string, TraceNode>; // Dictionary of nodes by their IDs
}

/**
 * Parses a string into a TraceTree structure with details and item nodes.
 * @param text - The input string to parse into a tree structure.
 * @param options - Optional settings for parsing, including whether to parse item nodes and which details nodes should be open.
 * @param options.parseItems - Flag to indicate if item nodes should be parsed.
 * @param options.openeds - Set of IDs for details nodes that should be open.
 * @returns The generated TraceTree structure containing the root node and a dictionary of nodes by ID.
 *
 * The function processes the input string line by line, identifying details blocks, summary tags, and item nodes based on specific patterns.
 * It calculates a hash for each line to generate unique IDs for nodes and maintains a stack to manage nested details blocks.
 */
export function parseTraceTree(
  text: string,
  options?: { parseItems?: boolean; openeds?: Set<string> },
): TraceTree {
  const { parseItems, openeds } = options || {};
  const nodes: Record<string, TraceNode> = {};
  const stack: DetailsNode[] = [
    { type: "details", label: "trace", id: "root", content: [] }, // Initialize root node
  ];
  nodes[stack[0].id] = stack[0];
  let hash = 0;
  const lines = (text || "").split("\n");
  for (let i = 0; i < lines.length; ++i) {
    const line = lines[i];
    // Calculate hash for line
    for (let j = 0; j < line.length; j++) {
      hash = (hash << 5) - hash + line.charCodeAt(j);
      hash |= 0;
    }
    // Detect start of a details block
    const startDetails = /^\s*<details([^>]*)>\s*$/m.exec(line);
    if (startDetails) {
      const parent = stack.at(-1);
      const current: DetailsNode = {
        type: "details",
        id: `${i}-${hash}`,
        label: "",
        content: [],
      };
      if (openeds) {
        if (openeds.has(current.id)) current.open = true;
      } else if (startDetails[1].includes("open")) current.open = true;

      parent.content.push(current);
      stack.push(current);
      nodes[current.id] = current;
      continue;
    }
    // Detect end of a details block
    const endDetails = /^\s*<\/details>\s*$/m.exec(lines[i]);
    if (endDetails) {
      // don't pop last element
      if (stack.length > 1) stack.pop();
      continue;
    }
    // Detect summary tag and set current label
    const summary = /^\s*<summary>(.*)<\/summary>\s*$/m.exec(lines[i]);
    if (summary) {
      const current = stack.at(-1);
      current.label = summary[1];
      continue;
    }
    // Handle multi-line summaries
    const startSummary = /^\s*<summary>\s*$/m.exec(lines[i]);
    if (startSummary) {
      let j = ++i;
      while (j < lines.length) {
        const endSummary = /^\s*<\/summary>\s*$/m.exec(lines[j]);
        if (endSummary) break;
        j++;
      }
      const current = stack.at(-1);
      current.label = lines.slice(i, j).join("\n");
      i = j;
      continue;
    }

    if (parseItems) {
      // Detect item node
      const item = /^\s*-\s+([^:]+): (.+)$/m.exec(lines[i]);
      if (item) {
        const current = stack.at(-1);
        current.content.push({
          type: "item",
          id: ("" + Math.random()).slice(2),
          label: item[1],
          value: item[2],
        });
        nodes[current.id] = current;
        continue;
      }
    }

    const contents = stack.at(-1).content;
    const content = lines[i];
    const lastContent = contents.at(-1);
    // Append to last content if it's a string, otherwise add new content
    if (typeof lastContent === "string")
      contents[contents.length - 1] = lastContent + "\n" + content;
    else contents.push(content);
  }

  return { root: stack[0], nodes };
}

/**
 * Renders a TraceNode into a markdown string.
 * @param node - The node to render. Can be a string, details node, or item node.
 * @param level - The depth level to render. Limits details expansion to this level.
 * @returns A markdown representation of the node. Returns "..." if the level is 0 for details nodes.
 */
export function renderTraceTree(node: TraceNode, level: number): string {
  if (!node) return "";
  if (typeof node === "string") {
    return node;
  } else if (node.type === "item") return `- ${node.label}: ${node.value}`;
  else if (node.type === "details")
    return details(
      node.label,
      level > 0 ? node.content.map((n) => renderTraceTree(n, level - 1)).join("\n") : "...",
    );
  else return "";
}
