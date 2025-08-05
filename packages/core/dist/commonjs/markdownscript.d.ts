import type { PromptArgs } from "./types.js";
/**
 * Parses a markdown script file with frontmatter and transpiles it to GenAIScript.
 *
 * @param filename - The name of the file being processed
 * @param text - The raw text of the document, including optional frontmatter and content body
 * @returns The transpiled JavaScript source code
 *
 * The parsing process:
 * - Splits the document into frontmatter and content using splitMarkdown
 * - Converts frontmatter to PromptArgs metadata
 * - Converts content body to $ calls for the prompt using unified/remark AST processing
 */
export declare function markdownScriptParse(text: string): Promise<{
    jsSource: string;
    meta: PromptArgs;
}>;
//# sourceMappingURL=markdownscript.d.ts.map