// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { diffLines } from "diff";
import { fenceMD } from "./mkmd.js";

/**
 * Generates a markdown-styled diff between two strings.
 *
 * @param oldStr - The original string to compare from. If undefined, the new string will be fenced as is.
 * @param newStr - The updated string to compare against the original.
 * @param options - Optional configuration object.
 * @param options.lang - Specifies the language for the fenced code block.
 * @param options.ignoreWhitespace - If true, ignores whitespace differences during the diff computation.
 * @returns A fenced markdown string representing the diff or the new string if oldStr is undefined.
 */
export function markdownDiff(
  oldStr: string,
  newStr: string,
  options?: {
    lang?: string;
    ignoreWhitespace?: boolean;
  },
) {
  const { lang, ...rest } = options || {};

  if (oldStr === undefined) return fenceMD(newStr, lang);

  const changes = diffLines(oldStr || "", newStr || "", rest);
  const source = changes.map((c) => `${c.added ? "+" : c.removed ? "-" : " "}${c.value}`).join("");
  return fenceMD(source, "diff");
}
