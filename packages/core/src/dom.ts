// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { genaiscriptDebug } from "./debug.js";
import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";

const dbg = genaiscriptDebug("dom");

export async function installWindow() {
  const glb = globalThis as any; // Get the global context
  if (glb.window) return;

  dbg(`installing window`);

  const { window } = new JSDOM("<!DOCTYPE html>");
  const DOMPurify = createDOMPurify(window as any);
  glb.window = window;
  glb.DOMPurify = DOMPurify;

  // mermaid workaround
  createDOMPurify.addHook = DOMPurify.addHook.bind(DOMPurify);
  createDOMPurify.sanitize = DOMPurify.sanitize.bind(DOMPurify);
}
