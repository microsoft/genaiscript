script({
  model: "small",
  title: "Weather as function",
  description: "Query the weather for each city using a dummy weather function",
  temperature: 0.5,
  toolChoice: { name: "get_current_weather" },
  tests: {},
});

$`What is the weather in seattle?`;

defTool(
  "get_current_weather",
  "get the current weather",
  {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "The city and state, e.g. San Francisco, CA",
      },
    },
    required: ["location"],
  },
  (args) => {
    const { context, location } = args;
    const { trace } = context;

    trace.log(`Getting weather for ${location}...`);

    let content = "variable";
    if (location === "Brussels") content = "sunny";

    return content;
  },
);
