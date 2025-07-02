// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { host } from "./host.js";
import { JSON5TryParse } from "./json5.js";
import { concatBuffers } from "./util.js";

function tryReadFile(fn: string) {
  return host.readFile(fn).then<Uint8Array>(
    (r) => r,
    (_) => null,
  );
}

/**
 * Determines if a given filename has a JSONL-compatible extension.
 *
 * @param fn - The filename to evaluate.
 * @returns True if the filename ends with .jsonl, .mdjson, or .ldjson (case-insensitive), otherwise false.
 */
export function isJSONLFilename(fn: string) {
  return /\.(jsonl|mdjson|ldjson)$/i.test(fn);
}

/**
 * Parses a JSONL (JSON Lines) formatted string into an array of objects.
 *
 * @param text - The string containing JSONL data. If empty, an empty array is returned.
 * @param options - Optional. Contains parsing configuration:
 *   - repair: If true, attempts to repair invalid JSON during parsing.
 *
 * @returns An array of parsed objects. Lines that fail parsing or are empty are skipped.
 */
export function JSONLTryParse(
  text: string,
  options?: {
    repair?: boolean;
  },
): any[] {
  if (!text) return [];
  const res: any[] = [];
  const lines = text.split("\n");
  for (const line of lines.filter((l) => !!l.trim())) {
    const obj = JSON5TryParse(line, options);
    if (obj !== undefined && obj !== null) res.push(obj);
  }
  return res;
}

/**
 * Converts an array of objects into a JSON Lines (JSONL) formatted string.
 *
 * @param objs - The array of objects to be serialized. Objects that are undefined or null are excluded from the output.
 * @returns A string where each object in the array is serialized as a JSON string and separated by newlines. Returns an empty string if the input array is empty or null.
 */
export function JSONLStringify(objs: any[]) {
  if (!objs?.length) return "";
  const acc: string[] = [];
  for (const o of objs.filter((o) => o !== undefined && o !== null)) {
    const s = JSON.stringify(o);
    acc.push(s);
  }
  return acc.join("\n") + "\n";
}

function serialize(objs: any[]) {
  const acc = JSONLStringify(objs);
  const buf = host.createUTF8Encoder().encode(acc);
  return buf;
}

async function writeJSONLCore(fn: string, objs: any[], append: boolean) {
  let buf = serialize(objs);
  if (append) {
    const curr = await tryReadFile(fn);
    if (curr) buf = concatBuffers(curr, buf);
  }
  await host.writeFile(fn, buf);
}

/**
 * Writes a JSON Lines (JSONL) file. Overwrites the file if it already exists.
 *
 * @param fn - The name of the file to write.
 * @param objs - An array of objects to serialize and write to the file.
 */
export async function writeJSONL(fn: string, objs: any[]) {
  await writeJSONLCore(fn, objs, false);
}

/**
 * Appends objects to a JSON Lines (JSONL) file. If metadata is provided, it will be added to each object before appending.
 *
 * @param name - The name of the JSONL file to append to.
 * @param objs - The objects to be appended to the file.
 * @param meta - Optional metadata to include in each appended object under the `__meta` key.
 */
export async function appendJSONL<T>(name: string, objs: T[], meta?: any) {
  if (meta)
    await writeJSONLCore(
      name,
      objs.map((obj) => ({ ...obj, __meta: meta })),
      true,
    );
  else await writeJSONLCore(name, objs, true);
}
