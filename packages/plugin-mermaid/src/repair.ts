// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { checkRuntime, genaiscriptDebug } from "@genaiscript/core";
import { mermaidParse } from "./mermaid.js";

const dbg = genaiscriptDebug("mermaid:repair");

export interface MermaidRepairResult {
  needsRepair: boolean;
  repairMessage?: string;
  repairedDiagrams?: Array<{ original: string; repaired: string }>;
}

export async function validateAndRepairMermaidDiagrams(
  assistantText: string,
  repaired: Set<string>,
  repairLimit: number,
  parsers: { fences: (text: string) => Array<{ language: string; content: string }> },
  runPrompt?: (
    generator: string | ((ctx: any) => void),
    options?: any
  ) => Promise<{ text: string }>
): Promise<MermaidRepairResult> {
  checkRuntime();
  
  if (repaired.size > repairLimit) {
    dbg(`too many diagram repairs, skipping`);
    return { needsRepair: false };
  }

  const fences = parsers.fences(assistantText);
  const diagrams = fences.filter((f) => f.language === "mermaid");
  const brokenDiagrams: Array<{ content: string; error: string }> = [];

  for (const diagram of diagrams) {
    if (!repaired.has(diagram.content)) {
      repaired.add(diagram.content);
      dbg(`validating %s`, diagram.content);

      try {
        const res = await mermaidParse(diagram.content);

        if (res?.error) {
          dbg(`error: %s`, res.error);
          brokenDiagrams.push({ content: diagram.content, error: res.error });
        } else {
          dbg(`parsed %s`, res.diagramType);
        }
      } catch (e) {
        dbg(`failed to parse mermaid: %s`, e);
        brokenDiagrams.push({ 
          content: diagram.content, 
          error: `Failed to parse mermaid diagram: ${e}` 
        });
      }
    }
  }

  if (brokenDiagrams.length === 0) {
    return { needsRepair: false };
  }

  // If runPrompt is available, try to automatically fix the diagrams
  if (runPrompt) {
    dbg(`attempting to auto-repair ${brokenDiagrams.length} diagrams`);
    const repairedDiagrams: Array<{ original: string; repaired: string }> = [];

    for (const brokenDiagram of brokenDiagrams) {
      try {
        dbg(`repairing diagram with error: %s`, brokenDiagram.error);
        
        const repairResult = await runPrompt(
          (ctx) => {
            ctx.$`You are a mermaid diagram expert. Fix the syntax errors in this mermaid diagram.

## Broken Diagram
\`\`\`mermaid
${brokenDiagram.content}
\`\`\`

## Error
${brokenDiagram.error}

Return ONLY the corrected mermaid diagram code, without markdown fences or explanations.`;
          },
          {
            label: "repair-mermaid-diagram",
            model: "small",
            temperature: 0.1,
          }
        );

        if (repairResult?.text) {
          const repairedContent = repairResult.text.trim();
          dbg(`repaired diagram: %s`, repairedContent);
          
          // Validate the repaired diagram
          try {
            const validation = await mermaidParse(repairedContent);
            if (!validation?.error) {
              repairedDiagrams.push({
                original: brokenDiagram.content,
                repaired: repairedContent
              });
              dbg(`repair successful for diagram`);
            } else {
              dbg(`repair failed validation: %s`, validation.error);
            }
          } catch (e) {
            dbg(`repair failed validation: %s`, e);
          }
        }
      } catch (e) {
        dbg(`failed to repair diagram: %s`, e);
      }
    }

    if (repairedDiagrams.length > 0) {
      return { 
        needsRepair: true, 
        repairedDiagrams 
      };
    }
  }

  // Fallback to original behavior if auto-repair failed or not available
  const errors = brokenDiagrams.map(d => d.error);
  const repairMessage = `I found syntax errors in the mermaid diagram. Please repair the parse error and replay with the full response:
${errors.join("\n")}`;
  return { needsRepair: true, repairMessage };
}