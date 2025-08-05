import type { Root, RootContent } from "mdast";
import type { WorkspaceFile } from "@genaiscript/core";
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
export declare function mdast(options?: MdAstOptions): Promise<Readonly<{
    parse: (file: string | WorkspaceFile) => Root;
    stringify: (root: Root | RootContent[], stringifyOptions?: object) => string;
    chunk: (nodes: Root | RootContent[], maxTokens: number, chunkOptions?: {
        tokenize: (text: string) => number;
    }) => RootContent[][];
    visit: typeof import("unist-util-visit", { with: { "resolution-mode": "import" } }).visit;
    visitParents: typeof import("unist-util-visit-parents", { with: { "resolution-mode": "import" } }).visitParents;
    inspect: typeof import("unist-util-inspect", { with: { "resolution-mode": "import" } }).inspect;
    CONTINUE: true;
    EXIT: false;
    SKIP: "skip";
}>>;
//# sourceMappingURL=unified.d.ts.map