import type { MdxCompilerOptions, PromptScript } from "./types.js";
import { frontmatterTryParse, splitMarkdown } from "../frontmatter.js";
import { genaiscriptDebug } from "../debug.js";
const dbg = genaiscriptDebug("mdx:transformer");

/**
 * Transforms MDX content into GenAIScript format
 */
export async function mdxTransform(
  content: string,
  scope: Record<string, unknown> = {},
  options: MdxCompilerOptions = {},
): Promise<string> {
  const { compile } = await import("@mdx-js/mdx");

  // Extract frontmatter
  const { frontmatter, content: mdxContent } = splitMarkdown(content);
  const fm = frontmatterTryParse(frontmatter);

  // Generate preamble from frontmatter
  const preamble = fm ? `script(${JSON.stringify(fm.value, null, 2)});\n` : "";
  dbg(`script: %s`, preamble);

  // Compile MDX to JavaScript
  const compiledFile = await compile(mdxContent, {
    jsxImportSource: "@genaiscript/core",    
    jsx: true,
    development: false,
    ...options.mdxOptions,
  });
  dbg(`file: %O`, compiledFile);
  const compiledMdx = compiledFile.toString();
  dbg(`js: %s`, compiledMdx);

  // Combine preamble with executed content
  const jsSource = `${preamble}${compiledMdx}`;
  return jsSource;
}
