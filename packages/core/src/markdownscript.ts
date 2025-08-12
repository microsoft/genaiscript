// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { Root } from "mdast";
import { splitMarkdown } from "./frontmatter.js";
import { YAMLParse } from "./yaml.js";
import { deleteUndefinedValues } from "./cleaners.js";
import { JSON5Stringify } from "./json5.js";
import type { PromptArgs } from "./types.js";
import { genaiscriptDebug } from "./debug.js";
import { resolve } from "node:path";
const dbg = genaiscriptDebug("md");

/**
 * Processes @include directives in markdown text by replacing them with file contents.
 * 
 * @param text - The markdown text containing @include directives
 * @param readText - Function to read file contents
 * @param baseDir - Base directory for resolving relative paths
 * @returns The processed text with @include directives replaced
 */
async function processIncludeDirectives(
  text: string,
  readText: (filepath: string) => Promise<string>,
  baseDir: string
): Promise<string> {
  const includeRegex = /@include\s+"([^"]+)"/g;
  let result = text;
  let match;

  while ((match = includeRegex.exec(text)) !== null) {
    const [fullMatch, filepath] = match;
    try {
      // Resolve the file path relative to baseDir
      const resolvedPath = resolve(baseDir, filepath);
      dbg(`processing @include directive: ${filepath} -> ${resolvedPath}`);
      
      const includedContent = await readText(resolvedPath);
      result = result.replace(fullMatch, includedContent);
    } catch (error) {
      // If file reading fails, replace with a comment indicating the error
      const errorMsg = `<!-- Error including ${filepath}: ${error.message} -->`;
      dbg(`failed to include ${filepath}: ${error.message}`);
      result = result.replace(fullMatch, errorMsg);
    }
  }

  return result;
}

/**
 * Parses a markdown script file with frontmatter and transpiles it to GenAIScript.
 *
 * @param text - The raw text of the document, including optional frontmatter and content body
 * @param options - Optional configuration including file reading capabilities and base directory
 * @returns The transpiled JavaScript source code
 *
 * The parsing process:
 * - Splits the document into frontmatter and content using splitMarkdown
 * - Converts frontmatter to PromptArgs metadata
 * - Processes @include directives to inline file contents
 * - Converts content body to $ calls for the prompt using unified/remark AST processing
 */
export async function markdownScriptParse(
  text: string,
  options?: {
    readText?: (filepath: string) => Promise<string>;
    baseDir?: string;
  }
) {
  const { readText, baseDir = "." } = options || {};

  // Process @include directives before splitting markdown
  let processedText = text;
  if (readText) {
    processedText = await processIncludeDirectives(text, readText, baseDir);
  }

  const { frontmatter = "", content = "" } = splitMarkdown(processedText);

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
