// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// This module provides utilities for handling markdown, including prettifying, cleaning,
// generating markdown structures, and parsing trace trees. It supports operations like
// converting annotations to markdown, wrapping text in fences, creating links and details blocks,
// and working with trace trees.

import { resolveFileDataUri } from "./filebytes.js";
import { CancellationOptions, checkCancelled } from "./cancellation.js";
import { HTTP_OR_S_REGEX } from "./constants.js";
import { genaiscriptDebug } from "./debug.js";
import { join, resolve } from "node:path";
const dbg = genaiscriptDebug("markdown");

/**
 * Splits a markdown string into an array of parts, where each part is either a text block or an image block.
 * Image blocks are objects of the form { type: "image", alt: string, url: string }. Only local images are supported.
 * Text blocks are objects of the form { type: "text", text: string }.
 * @param markdown The markdown string to split.
 */
export async function splitMarkdownTextImageParts(
  markdown: string,
  options?: CancellationOptions & {
    dir?: string;
    allowedDomains?: string[];
    convertToDataUri?: boolean;
  },
) {
  const { dir = "", cancellationToken, allowedDomains, convertToDataUri } = options || {};
  // remove \. for all images
  const regex = /^!\[(?<alt>[^\]]*)\]\((?<imageUrl>\.[^)]+)\)$/gm;
  const parts: (
    | { type: "text"; text: string }
    | { type: "image"; data: string; mimeType: string }
  )[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(markdown)) !== null) {
    checkCancelled(cancellationToken);
    if (match.index > lastIndex) {
      const text = markdown.slice(lastIndex, match.index);
      if (text) parts.push({ type: "text", text });
    }

    const { alt, imageUrl } = match.groups;

    let data: string;
    let mimeType: string;
    const isDataUri = /^datauri:\/\//.test(imageUrl);
    if (isDataUri) {
      // TODO
    } else if (HTTP_OR_S_REGEX.test(imageUrl)) {
      // TODO
    } else if (/^\./.test(imageUrl)) {
      dbg(`local image: %s`, imageUrl);
      if (convertToDataUri) {
        const filename = resolve(join(dir, imageUrl));
        dbg(`local file: %s`, filename);
        try {
          const res = await resolveFileDataUri(filename, options);
          data = res.data;
          mimeType = res.mimeType;
        } catch (err) {
          dbg(`%O`, err);
        }
      }
    }
    if (data && mimeType) {
      parts.push({ type: "image", data, mimeType });
    } else {
      const lastPart = parts.at(-1);
      if (lastPart?.type === "text") lastPart.text += match[0];
      else parts.push({ type: "text", text: match[0] });
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < markdown.length) {
    const text = markdown.slice(lastIndex);
    if (text) parts.push({ type: "text", text });
  }
  return parts;
}
