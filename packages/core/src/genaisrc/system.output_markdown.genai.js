system({ title: "Markdown output system prompt" })
$`## Markdown Output
Respond in Markdown (GitHub Flavored Markdown also supported). Do not wrap response in a 'markdown' code block.`
if (/o3/.test(env.meta.model)) $`Formatting re-enabled.`
