script({
  system: [
    "system",
    {
      id: "system.fetch",
      parameters: { domains: ["azure.microsoft.com"] },
    },
  ],
});

$`Generate a pricing table of the LLM prices at https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service .
Use today's prices.`;
