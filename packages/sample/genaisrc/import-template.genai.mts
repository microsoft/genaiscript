script({
    model: "small",
    tests: {
        keywords: ["paris", "berlin"],
    },
})
const question = "- What is the capital of France?"
const hint = () => {
    return "- What is the capital of Germinay"
}
await runPrompt((_) =>
    _.importTemplate("src/templates/basic.prompty", { question, hint, n: 5 })
)
importTemplate(
    {
        filename: "",
        content: `---
name: Basic Prompt
description: A basic prompt that uses the chat API to answer questions
model:
    api: chat
    configuration:
        type: azure_openai
        azure_deployment: gpt-4o_2024-08-06
    parameters:
        max_tokens: 128
        temperature: 0.2
inputs:
  question:
    type: string
  hint:
    type: string
  n:
    type: number
sample:
  question: Who is the capital of france?
  hint: starts with p
  n: 5
tests:
  - vars:
      question: what is the capital of france?
      hint: "it starts with pa"
    keywords: "paris"
---
system:
You are an AI assistant who helps people find information. Answer all questions to the best of your ability.
As the assistant, you answer questions briefly, succinctly. 

{% if n > 0 %}
Give multiple hints (n = {{n}})
{% else %}
Give only 1 hint (n = {{n}}).
{% endif %}


user:
{{question}}

{{hint}}
`,
    },
    { question, hint, n: 5 }
)
