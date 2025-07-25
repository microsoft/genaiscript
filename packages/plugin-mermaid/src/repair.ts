// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { ChatGenerationContext } from "@genaiscript/core";
import { parsers } from "@genaiscript/core";
import { mermaidParse } from "./mermaid.js";

export interface MermaidRepairOptions {
  maxRepairs: number;
  logger?: (message: string, ...args: any[]) => void;
}

export function createMermaidRepairChatParticipant(options: MermaidRepairOptions) {
  const { maxRepairs, logger } = options;
  const dbg = logger || (() => {}); // Default no-op logger
  const repaired = new Set<string>();

  return async function mermaidRepairChatParticipant(
    ctx: ChatGenerationContext,
    messages: any[],
    assistantText: string
  ): Promise<{ messages: any[] } | void> {
    if (!(maxRepairs > 0)) return;

    if (repaired.size > maxRepairs) {
      dbg(`too many diagram repairs, skipping`);
      return;
    }

    const fences = parsers.fences(assistantText);
    const diagrams = fences.filter((f: any) => f.language === "mermaid");
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
      return;
    }

    // If runPrompt is available, try to automatically fix the diagrams
    if (ctx.runPrompt) {
      dbg(`attempting to auto-repair ${brokenDiagrams.length} diagrams`);
      const repairedDiagrams: Array<{ original: string; repaired: string }> = [];

      for (const brokenDiagram of brokenDiagrams) {
        try {
          dbg(`repairing diagram with error: %s`, brokenDiagram.error);
          
          const repairResult = await ctx.runPrompt(
            (ctx: any) => {
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
        // Auto-repair succeeded - replace broken diagrams in messages
        dbg(`auto-repaired ${repairedDiagrams.length} diagrams`);
        
        // Find and update the last assistant message
        const updatedMessages = [...messages];
        const lastAssistantMessage = [...updatedMessages].reverse().find(m => m.role === "assistant");
        
        if (lastAssistantMessage && typeof lastAssistantMessage.content === "string") {
          let updatedContent = lastAssistantMessage.content;
          
          // Replace each broken diagram with its repaired version
          for (const { original, repaired: repairedContent } of repairedDiagrams) {
            updatedContent = updatedContent.replace(original, repairedContent);
          }
          
          // Update the message content
          lastAssistantMessage.content = updatedContent;
          dbg(`updated assistant message with repaired diagrams`);
          
          return { messages: updatedMessages };
        }
      }
    }

    // Fallback to original behavior if auto-repair failed or not available
    const errors = brokenDiagrams.map(d => d.error);
    const repairMessage = `I found syntax errors in the mermaid diagram. Please repair the parse error and replay with the full response:
${errors.join("\n")}`;
    dbg(`auto-repair failed, requesting manual repair`);
    ctx.$`${repairMessage}`;
  };
}