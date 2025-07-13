// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { dedent as localDedent } from "ts-dedent";

/**
 * Indents each line of a given text by a specified indentation string.
 *
 * @param text - The input text to be indented. Returns the original text if it is undefined, null, or empty.
 * @param indentation - The string to prepend to each line of the input text.
 * @returns The indented text or the original input if it is undefined, null, or empty.
 */
export function indent(text: string, indentation: string) {
  if (text === undefined || text === null || text === "") return text;
  return text
    ?.split(/\r?\n/g)
    .map((line) => indentation + line)
    .join("\n");
}

/**
 * Unindents a string.
 *
 * @param templ - Template or string to unindent.
 * @param values - Values to interpolate into the template.
 */
export function dedent(templ: TemplateStringsArray | string, ...values: unknown[]): string {
  if (templ === undefined) return undefined;
  if (templ === null) return null;
  return localDedent(templ, ...values);
}
