import { trimNewlines } from "./unwrappers";

const contentTypes: Record<string, string> = {
  markdown: "md",
  prompty: "md",
  javascript: "js",
  typescript: "ts",
  yml: "yaml",
};

/**
 * Wraps text in a markdown code fence, extending the fence if the text contains existing fences.
 * @param t - The text to wrap in a code fence. Returns undefined if not provided.
 * @param contentType - The content type to specify after the code fence. Defaults to "markdown".
 * @returns The text wrapped in a code fence.
 */
export function fenceMD(t: string, contentType?: string) {
  if (t === undefined) return undefined;
  contentType = contentTypes[contentType] || contentType || "";
  let f = "```";
  while (t.includes(f) && f.length < 8) f += "`"; // Extend fence if necessary
  return `\n${f}${contentType}\n${trimNewlines(t)}\n${f}\n`;
}

/**
 * Creates a markdown link if href is provided, otherwise returns plain text.
 * @param text - The link text.
 * @param href - The URL, if any.
 * @returns A markdown link or plain text.
 */
export function link(text: string, href: string) {
  return href ? `[${text}](${href})` : text;
}

/**
 * Generates a markdown details block with an optional open state.
 * @param summary - The summary text for the details block.
 * @param body - The content inside the details block.
 * @param open - Whether the details block should be open by default.
 * @returns A string representing a markdown details block.
 */
export function details(summary: string, body: string, open?: boolean) {
  return `\n<details${open ? " open" : ""}>
<summary>${summary}</summary>

${body}

</details>\n`;
}
