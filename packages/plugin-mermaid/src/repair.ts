// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { checkRuntime, genaiscriptDebug } from "@genaiscript/core";
import { mermaidParse } from "./mermaid.js";

const dbg = genaiscriptDebug("mermaid:repair");

export interface MermaidRepairResult {
  needsRepair: boolean;
  repairMessage?: string;
}

export async function validateAndRepairMermaidDiagrams(
  assistantText: string,
  repaired: Set<string>,
  repairLimit: number,
  parsers: { fences: (text: string) => Array<{ language: string; content: string }> }
): Promise<MermaidRepairResult> {
  checkRuntime();
  
  if (repaired.size > repairLimit) {
    dbg(`too many diagram repairs, skipping`);
    return { needsRepair: false };
  }

  const fences = parsers.fences(assistantText);
  const diagrams = fences.filter((f) => f.language === "mermaid");
  const errors: string[] = [];

  for (const diagram of diagrams) {
    if (!repaired.has(diagram.content)) {
      repaired.add(diagram.content);
      dbg(`validating %s`, diagram.content);

      try {
        const res = await mermaidParse(diagram.content);

        if (res?.error) {
          dbg(`error: %s`, res.error);
          errors.push(res.error);
        } else {
          dbg(`parsed %s`, res.diagramType);
        }
      } catch (e) {
        dbg(`failed to parse mermaid: %s`, e);
        errors.push(`Failed to parse mermaid diagram: ${e}`);
      }
    }
  }

  if (errors.length > 0) {
    const repairMessage = `I found syntax errors in the mermaid diagram. Please repair the parse error and replay with the full response:
${errors.join("\n")}`;
    return { needsRepair: true, repairMessage };
  }

  return { needsRepair: false };
}