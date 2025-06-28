import { filenameOrFileToContent, WorkspaceFile } from "@genaiscript/core";
import { mermaidParse } from "./mermaid.js";

export async function parse(
  file: string | WorkspaceFile,
): Promise<{ diagramType?: string; error?: string }> {
  const f = filenameOrFileToContent(file);
  const res = await mermaidParse(f);
  return res;
}
