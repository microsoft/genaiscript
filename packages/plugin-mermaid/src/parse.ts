// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { WorkspaceFile } from "@genaiscript/core";
import { checkRuntime, filenameOrFileToContent } from "@genaiscript/core";
import { mermaidParse } from "./mermaid.js";

export async function parse(
  file: string | WorkspaceFile,
): Promise<{ diagramType?: string; error?: string }> {
  checkRuntime();
  const f = filenameOrFileToContent(file);
  const res = await mermaidParse(f);
  return res;
}
