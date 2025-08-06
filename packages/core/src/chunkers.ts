// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { assert } from "./assert.js";

/**
 * Splits a string into chunks of specified size.
 * Parameters:
 * - s: Input string to split. Must be non-null and non-empty.
 * - n: Maximum size of each chunk. Defaults to 2 << 14.
 * Returns:
 * - Array of string chunks. Each chunk's length is <= n.
 */
export function chunkString(s: string, n: number = 2 << 14) {
  if (!s?.length) return [];
  if (s.length <= n) return [s];

  const r: string[] = [];
  for (let i = 0; i < s.length; i += n) {
    r.push(s.slice(i, i + n));
    assert(r[r.length - 1].length <= n);
  }
  return r;
}

/**
 * Splits a string into chunks of lines, ensuring each chunk's size does not exceed the specified limit.
 *
 * @param s - Input string to split. Must be non-null and non-empty.
 * @param n - Maximum size of each chunk in characters. Defaults to 2 << 14.
 * @returns Array of string chunks, where each chunk consists of complete lines and has a size <= n.
 */
export function chunkLines(s: string, n: number = 2 << 14) {
  if (!s?.length) return [];
  if (s.length <= n) return [s];

  const r: string[] = [""];
  const lines = s.split(/\r?\n/);
  for (const line of lines) {
    if (r[r.length - 1].length + line.length > n) r.push("");
    r[r.length - 1] += line + "\n";
  }
  return r;
}
