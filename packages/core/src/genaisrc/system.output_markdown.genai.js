system({ title: "Markdown output system prompt" })
$`## Markdown Output
Respond using Markdown syntax (GitHub Flavored Markdown also supported).
**do NOT wrap response in a 'markdown' code block!`
if (/o3/.test(env.meta.model)) $`Formatting re-enabled.`
