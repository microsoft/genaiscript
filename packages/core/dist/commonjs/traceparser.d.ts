export interface ItemNode {
    id?: string;
    type: "item";
    label: string;
    value: string;
}
export interface DetailsNode {
    id?: string;
    type: "details";
    label: string;
    content: TraceNode[];
    open?: boolean;
}
export type TraceNode = string | DetailsNode | ItemNode;
export interface TraceTree {
    root: DetailsNode;
    nodes: Record<string, TraceNode>;
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
export declare function parseTraceTree(text: string, options?: {
    parseItems?: boolean;
    openeds?: Set<string>;
}): TraceTree;
/**
 * Renders a TraceNode into a markdown string.
 * @param node - The node to render. Can be a string, details node, or item node.
 * @param level - The depth level to render. Limits details expansion to this level.
 * @returns A markdown representation of the node. Returns "..." if the level is 0 for details nodes.
 */
export declare function renderTraceTree(node: TraceNode, level: number): string;
//# sourceMappingURL=traceparser.d.ts.map