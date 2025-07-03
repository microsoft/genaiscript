// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { WorkspaceFile } from "@genaiscript/core";
import { filenameOrFileToContent } from "@genaiscript/core";
import { mermaidParse } from "./mermaid.js";

export async function parse(
  file: string | WorkspaceFile,
): Promise<{ diagramType?: string; error?: string }> {
  const f = filenameOrFileToContent(file);
  const res = await mermaidParse(f);
  return res;
}
