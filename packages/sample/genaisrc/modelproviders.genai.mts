script({ model: "echo", group: "commit", tests: {} })

const gh = await host.resolveLanguageModelProvider("github_copilot_chat")
console.log({ gh })
const oai = await host.resolveLanguageModelProvider("openai")
console.log({ oai })
