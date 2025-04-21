script({
    system: [
        "system",
        {
            id: "system.fetch",
            parameters: { domains: ["azure.microsoft.com"] },
        },
    ],
})

$`Summarize the LLM prices at https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service`
