// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { genaiscriptDebug } from "./debug.js";
import { installWindow } from "./dom.js";
import { errorMessage } from "./error.js";
import type { Mermaid } from "mermaid";
import mermaid from "mermaid";

const dbg = genaiscriptDebug("mermaid");

let _mermaid: Promise<Mermaid>;
async function importMermaid() {
  if (_mermaid) return _mermaid;

  await installWindow();
  dbg(`importing`);
  mermaid.initialize({ startOnLoad: false });
  return mermaid;
}

export async function mermaidParse(
  text: string,
): Promise<{ diagramType?: string; error?: string }> {
  const mermaid = await importMermaid();
  try {
    dbg(`parsing %s`, text);
    const res = await mermaid.parse(text, { suppressErrors: false });
    if (!res) return { error: "no result" };
    return { diagramType: res.diagramType };
  } catch (e) {
    const m = errorMessage(e);
    dbg(`mermaid error: %s`, m);
    return { error: m };
  }
}
