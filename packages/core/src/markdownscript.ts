// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { visit } from "unist-util-visit";
import type { Root } from "mdast";
import { splitMarkdown } from "./frontmatter.js";
import { YAMLParse } from "./yaml.js";
import { deleteUndefinedValues } from "./cleaners.js";
import { JSON5Stringify } from "./json5.js";
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
export function markdownScriptParse(text: string) {
  const { frontmatter = "", content = "" } = splitMarkdown(text);

  // Parse frontmatter as YAML and convert to PromptArgs
  const fm = frontmatter ? YAMLParse(frontmatter) : {};
  const meta: PromptArgs = deleteUndefinedValues(fm);

  // Generate the script source
  let jsSource = "";

  // Add script configuration if metadata exists
  if (Object.keys(meta).length) {
    jsSource += `script(${JSON5Stringify(meta, null, 2)})\n\n`;
  }

  // Convert markdown content to $ call using unified/remark
  if (content.trim()) {
    // Parse the markdown content into an AST
    const processor = unified()
      .use(remarkParse)
      .use(() => (tree: Root) => {
        // Optional: Visit and transform nodes if needed in the future
        // For now, we just parse and stringify to ensure proper handling
        visit(tree, (node) => {
          // This is where we could add custom transformations
          // Currently just preserving the original behavior
        });
      })
      .use(remarkStringify, {
        // Configure stringify options to preserve formatting
        bullet: "-",
        fence: "`",
        fences: true,
        incrementListMarker: false,
      });

    // Process the content through the unified pipeline
    const result = processor.processSync(content);
    const processedContent = String(result);

    // Escape backticks in the processed content
    const escapedContent = processedContent.replace(/`/g, "\\`");
    jsSource += `$\`${escapedContent}\``;
  }

  return { jsSource, meta };
}
