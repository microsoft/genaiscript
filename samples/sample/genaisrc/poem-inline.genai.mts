const res = await prompt`Write a short poem in code.`;
env.output.item(`llm poem: ${res.text.length}`)
