script({ model: "github_copilot_chat:gpt-4.1", metadata: { name: "haiku" } })
$`Write a haiku about ${env.files[0] || "code"}`
