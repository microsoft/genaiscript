system({ title: "Base system prompt" })
$`## Markdown Output
Respond in Markdown (GitHub Flavored Markdown also supported).`
if (/o3/.test(env.meta.model)) $`Formatting re-enabled.`
