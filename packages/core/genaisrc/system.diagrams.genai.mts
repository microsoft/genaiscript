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
    if (repaired.size > repair) {
      dbg(`too many diagram repairs, skipping`);
      return;
    }
    
    const fences = parsers.fences(assistantText);
    const diagrams = fences.filter((f) => f.language === "mermaid");
    const errors: string[] = [];
    
    for (const diagram of diagrams) {
      if (!repaired.has(diagram.content)) {
        repaired.add(diagram.content);
        dbg(`validating %s`, diagram.content);
        
        try {
          // Import the mermaid parser dynamically
          const { mermaidParse } = await import("@genaiscript/plugin-mermaid");
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
      ctx.$`I found syntax errors in the mermaid diagram. Please repair the parse error and replay with the full response:
${errors.join("\n")}`;
    }
  });
}
