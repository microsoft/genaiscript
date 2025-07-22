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
import { genaiscriptDebug } from "./debug.js";
const dbg = genaiscriptDebug("md");

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
    const parse = unified().use(remarkParse);
    const stringify = unified().use(remarkStringify, {
      bullet: "-",
      fence: "`",
      fences: true,
      incrementListMarker: false,
    });
    const tree = parse.parse(content);

    for (const child of tree.children) {
      if (child.type === "code" && /^(ts|js|typescript|javascript)\s+genai/.test(child.lang)) {
        dbg(`js block`);
        jsSource += child.value + "\n";
      } else {
        const tempTree = { type: "root", children: [child] } as Root;
        const result = stringify.stringify(tempTree);
        const escapedContent = result.replace(/`/g, "\\`");
        jsSource += `$\`${escapedContent}\`\n\n`;
      }
    }
  }

  return { jsSource, meta };
}
