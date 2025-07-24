system({
  title: "Generate diagrams",
  parameters: {
    repair: {
      type: "integer",
      default: 3,
      description: "Repair mermaid diagrams",
    },
  },
});

const dbg = host.logger("genaiscript:system:diagrams");

export default function (ctx: ChatGenerationContext) {
  const { $, defChatParticipant } = ctx;
  const repair = env.vars["system.diagrams.repair"];

  $`## Diagrams Format = Mermaid
You are a mermaid expert.
Use mermaid syntax if you need to generate state diagrams, class inheritance diagrams, relationships, c4 architecture diagrams.
Pick the most appropriate diagram type for your needs.
Use clear, concise node and relationship labels.
Ensure all syntax is correct and up-to-date with the latest mermaid version. Validate your diagrams before returning them.
Use clear, concise node and relationship labels.
Implement appropriate styling and colors to enhance readability but watch out for syntax errors.
Keep labels short and simple to minimize syntax errors.
`;

  if (!(repair > 0)) return;

  dbg(`registering mermaid repair`);
  const repaired = new Set<string>();
  defChatParticipant(async (ctx, messages, assistantText) => {
    try {
      // Import the mermaid repair helper dynamically
      const { validateAndRepairMermaidDiagrams } = await import("@genaiscript/plugin-mermaid");
      const result = await validateAndRepairMermaidDiagrams(
        assistantText, 
        repaired, 
        repair, 
        parsers,
        ctx.runPrompt
      );
      
      if (result.needsRepair) {
        if (result.repairedDiagrams && result.repairedDiagrams.length > 0) {
          // Auto-repair succeeded - replace broken diagrams in messages
          dbg(`auto-repaired ${result.repairedDiagrams.length} diagrams`);
          
          // Find and update the last assistant message
          const updatedMessages = [...messages];
          const lastAssistantMessage = [...updatedMessages].reverse().find(m => m.role === "assistant");
          
          if (lastAssistantMessage && typeof lastAssistantMessage.content === "string") {
            let updatedContent = lastAssistantMessage.content;
            
            // Replace each broken diagram with its repaired version
            for (const { original, repaired: repairedContent } of result.repairedDiagrams) {
              updatedContent = updatedContent.replace(original, repairedContent);
            }
            
            // Update the message content
            lastAssistantMessage.content = updatedContent;
            dbg(`updated assistant message with repaired diagrams`);
            
            return { messages: updatedMessages };
          }
        } else if (result.repairMessage) {
          // Fallback to original behavior - ask for manual repair
          dbg(`auto-repair failed, requesting manual repair`);
          ctx.$`${result.repairMessage}`;
        }
      }
    } catch (e) {
      dbg(`failed to load mermaid repair helper: %s`, e);
    }
  });
}
