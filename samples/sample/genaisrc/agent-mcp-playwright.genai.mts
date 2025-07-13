script({
  title: "Wraps the playwright MCP server with an agent.",
  group: "mcp",
  accept: "none",
  mcpAgentServers: {
    playwright: {
      description: "An agent that uses playwright to run browser commands and solve a task.",
      command: "npx",
      args: ["--yes", "@playwright/mcp@latest", "--headless"],
      instructions: "Use the playwright tools as the Browser Automation Tools.",
      maxTokens: 12000,
    },
  },
  parameters: {
    task: {
      type: "string",
      default:
        "Extract the OpenAI pricing from https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/",
      description: "A task that requires playwright to be solved..",
    },
  },
});
const { task } = env.vars;

def("TASK", task);

$`You are an an agent and your task is <TASK>. Use the tools provided to you to solve the task.
Do not return control until you have achieved the task.`;
