script({
  tests: {
    keywords: "sunny",
  },
  fallbackTools: true,
});
defTool(
  "get_weather",
  "Get the real-time weather information at a given location or city",
  {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "The city and state, e.g. Chicago, IL",
      },
    },
    required: ["location"],
  },
  ({ location }) => {
    return /paris/i.test(location) ? "sunny" : "unknown";
  },
);

const res = await runPrompt(
  (_) => {
    _.defTool(
      "get_weather",
      "Get the real-time weather information at a given location or city",
      {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city and state, e.g. Chicago, IL",
          },
        },
        required: ["location"],
      },
      ({ location }) => {
        return /brussels/i.test(location) ? "cloudy" : "unknown";
      },
    );
    _.$`What is the current weather in Brussels?`;
  },
  { fallbackTools: true },
);
if (res.error) throw new Error(res.error.message);
if (!res.text.includes("cloudy")) throw new Error("Expected cloudy weather in Brussels");

$`What is the current weather in Paris?`;
