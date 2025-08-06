import { fileURLToPath } from "url";
import path from "path";

script({
  title: "Upgrade samples",
  description: "Upgrade Dev Proxy samples to the specified version",
  accept: ".md,.json",
  parameters: {
    version: {
      type: "string",
      description: "The Dev Proxy version to upgrade the samples to",
      default: "v0.29.0",
    },
  },
});

const { output } = env;
const { text } = await runPrompt(
  (ctx) => {
    ctx.$`How to get started with Dev Proxy? Use FindDocs to search the Dev Proxy documentation`;
  },
  {
    mcpServers: {
      devProxy: {
        command: "npx",
        args: ["-y", "@devproxy/mcp"],
        disableToolIdMangling: true,
      },
    },
  },
);
output.itemValue(`version`, text);
