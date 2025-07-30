// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

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
export async function markdownScriptParse(text: string) {
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
    const { unified } = await import("unified");
    const { default: remarkParse } = await import("remark-parse");
    const { default: remarkStringify } = await import("remark-stringify");

    // Parse the markdown content into an AST
    const parse = unified().use(remarkParse);
    const stringify = unified().use(remarkStringify, {
      bullet: "-",
      fence: "`",
      fences: true,
      incrementListMarker: true,
    });
    const tree = parse.parse(content);

    let contents: string[] = [];

    const flush = () => {
      if (contents.length) jsSource += `$\`${contents.join("\n")}\`\n\n`;
      contents = [];
    };

    for (const child of tree.children) {
      if (
        child.type === "code" &&
        /^(ts|js|typescript|javascript)$/i.test(child.lang) &&
        /genai/i.test(child.meta)
      ) {
        dbg(`js block`);
        flush();
        jsSource += `// ${child.lang} ${child.meta} (${child.position?.start?.line || "--"})\n`;
        jsSource += child.value + "\n\n";
      } else if (
        child.type === "paragraph" &&
        child.children.length === 1 &&
        child.children[0].type === "image"
      ) {
        dbg(`image`);
        flush();
        const img = child.children[0];
        jsSource += `// image ${img.alt || "no alt"} (${img.position?.start?.line || "--"})\n`;
        jsSource += `defImages(${JSON.stringify(img.url)});\n\n`;
      } else {
        const tempTree = { type: "root", children: [child] } as Root;
        const result = stringify.stringify(tempTree);
        const escapedContent = result.replace(/`/g, "\\`");
        contents.push(escapedContent);
      }
    }
    flush();
  }

  dbg(`meta: %O`, meta);
  dbg(`js: %s`, jsSource);
  return { jsSource, meta };
}
