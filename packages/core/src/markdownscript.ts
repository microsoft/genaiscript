// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

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
 * - Converts content body to $ calls for the prompt
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

  // Convert markdown content to $ call
  if (content.trim()) {
    // Escape backticks in the content
    const escapedContent = content.replace(/`/g, "\\`");
    jsSource += `$\`${escapedContent}\``;
  }

  return { jsSource, meta };
}
