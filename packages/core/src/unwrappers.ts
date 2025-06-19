import { arrayify } from "./cleaners";

/**
 * Remove code fences from a fenced block for the specified language.
 * @param text - The text containing the fenced block.
 * @param language - The language or array of languages used in the fence. Use "*" to match any language. Null or undefined values in the array are ignored.
 * @returns The text without fences, or the original text if no fences are found.
 */
export function unfence(text: string, language?: "*" | ElementOrArray<string>) {
  if (!text) return text;

  language = arrayify(language);
  const lg = language
    .filter((s) => s !== undefined && s !== null)
    .map((l) => (l === "*" ? ".*?" : l.replace(/[^a-z0-9_]/gi, "")))
    .join("|");
  const startRx = new RegExp(`^[\r\n\s]*(\`{3,})(${lg})\s*\r?\n`, "i");
  const mstart = startRx.exec(text);
  if (mstart) {
    const n = mstart[1].length;
    const endRx = new RegExp(`\r?\n\`{${n},${n}}[\r\n\s]*$`, "i");
    const mend = endRx.exec(text);
    if (mend) return text.slice(mstart.index + mstart[0].length, mend.index);
  }
  return text;
}

/**
 * Remove quotes from the beginning and end of a string if they exist and match.
 * @param s - The string to unquote.
 * @returns The unquoted string, or the original string if no matching quotes are found.
 */
export function unquote(s: string) {
  for (const sep of "\"'`") if (s && s[0] === sep && s[s.length - 1] === sep) return s.slice(1, -1);
  return s;
}

/**
 * Converts a file or its content into a string representation of the content.
 *
 * @param fileOrContent - Either the file content as a string or a file object containing `content` property.
 * @returns The content of the file as a string.
 */
export function filenameOrFileToContent(fileOrContent: string | WorkspaceFile): string {
  return typeof fileOrContent === "string" ? fileOrContent : fileOrContent?.content;
}

/**
 * Extracts the filename from a string or a workspace file object.
 *
 * @param fileOrContent - Either a string representing a filename or a WorkspaceFile object containing filename and content.
 * @returns The extracted filename as a string.
 */
export function filenameOrFileToFilename(fileOrContent: string | WorkspaceFile): string {
  return typeof fileOrContent === "string"
    ? fileOrContent
    : typeof fileOrContent === "object"
      ? fileOrContent?.filename
      : undefined;
}

/**
 * Removes leading and trailing newline characters from a string.
 *
 * @param s - The string to process. If null or undefined, it is returned as is.
 * @returns The string without leading or trailing newlines.
 */
export function trimNewlines(s: string) {
  return s?.replace(/^\n*/, "").replace(/\n*$/, "");
}
