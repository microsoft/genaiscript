script({
  title: "News Agent",
  description: "Connect today's news about a topic",
  system: ["system", "system.agent_web"],
  group: "web",
  parameters: {
    topic: {
      type: "string",
      description: "The topic to search for",
      default: "sports",
    },
  },
  tests: {},
});
const { topic } = env.vars;

$`Search the web for news about ${topic} and summarize them.`;
