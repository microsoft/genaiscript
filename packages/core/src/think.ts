import { deleteUndefinedValues } from "./cleaners";
import { THINK_REGEX } from "./constants";

/**
 * Converts custom "think" tags within a string to Markdown format with collapsible HTML elements.
 *
 * @param md - The input string containing "think" tags to be converted.
 * @returns The string with "think" tags replaced by collapsible Markdown syntax. If the input is empty, returns the input as is.
 */
export function convertThinkToMarkdown(md: string) {
  if (!md) return md;

  md = md.replace(THINK_REGEX, (_, text, end) => {
    return `\n<details><summary>🤔 think${end === "</think>" ? "" : "ing..."}</summary>${text}</details>\n`;
  });
  return md;
}

/**
 * Removes all occurrences of THINK_REGEX matches from the given string.
 *
 * @param md - The string from which THINK_REGEX matches will be removed.
 *             If the input is null or empty, it is returned as is.
 * @returns The modified string with THINK_REGEX matches removed, or the original string if no matches are found.
 */
export function unthink(md: string) {
  if (!md) return md;

  md = md.replace(THINK_REGEX, "");
  return md;
}

/**
 * /**
 *  * Parses input text to separate main content and reasoning enclosed within `
 */
export function splitThink(text: string): {
  content: string;
  reasoning: string;
} {
  const reasoning: string[] = [];
  const res = text?.replace(THINK_REGEX, (_, text, end) => {
    reasoning.push(text);
    return "";
  });

  return deleteUndefinedValues({
    content: res,
    reasoning: reasoning.length ? reasoning.join("\n") : undefined,
  });
}
