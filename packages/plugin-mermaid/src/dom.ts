// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { genaiscriptDebug } from "@genaiscript/core";

const dbg = genaiscriptDebug("dom");

export async function installWindow() {
  const glb = globalThis as any; // Get the global context
  if (glb.window) return;

  dbg(`installing window`);

  const { JSDOM } = await import("jsdom");
  const createDOMPurify = (await import("dompurify")).default;

  const { window } = new JSDOM("<!DOCTYPE html>");
  const DOMPurify = createDOMPurify(window as any);
  glb.window = window;
  glb.DOMPurify = DOMPurify;

  // mermaid workaround
  createDOMPurify.addHook = DOMPurify.addHook.bind(DOMPurify);
  createDOMPurify.sanitize = DOMPurify.sanitize.bind(DOMPurify);
}
