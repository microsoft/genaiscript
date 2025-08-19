const { output } = env;
const res = await prompt`Write a short poem in code.`;
output.item(`llm poem: ${res.text.length}`)
output.fence(res.text)
