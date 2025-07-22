/**
 * Example GenAI script using the openai_responses provider
 */

// Example using the openai_responses provider with structured output
script({
    title: "OpenAI Responses Example",
    model: "openai_responses:gpt-4o-mini",
    temperature: 0.1,
})

$`Generate a JSON response with this structure:
{
  "greeting": "A friendly greeting message",  
  "tips": ["tip1", "tip2", "tip3"],
  "conclusion": "A brief conclusion"
}

Please generate actual content for a guide about using AI assistants.`