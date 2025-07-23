/**
 * Example showing how to use the OpenAI Responses API for optimized structured outputs
 */
script({
    model: "openai:gpt-4o-mini", // The OpenAI provider now uses Responses API by default
    tests: {},
    responseSchema: {
        type: "object",
        properties: {
            analysis: {
                type: "object",
                properties: {
                    sentiment: {
                        type: "string", 
                        enum: ["positive", "negative", "neutral"],
                        description: "The overall sentiment"
                    },
                    confidence: {
                        type: "number",
                        minimum: 0,
                        maximum: 1,
                        description: "Confidence level from 0 to 1"  
                    },
                    key_points: {
                        type: "array",
                        items: {
                            type: "string"
                        },
                        description: "Main points from the text"
                    }
                },
                required: ["sentiment", "confidence", "key_points"]
            }
        },
        required: ["analysis"]
    }
})

// The OpenAI provider now automatically uses the Responses API
// which provides better structured output handling
$`Analyze the following text and provide sentiment analysis with key points:

"I'm really excited about the new features in this software update. 
The user interface improvements make everything so much easier to use, 
and the performance gains are noticeable. However, I do wish the 
documentation was more comprehensive."
`