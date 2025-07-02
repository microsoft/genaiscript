script({ model: "echo", group: "commit", tests: {} });

const az = await host.resolveLanguageModelProvider("azure", {
  listModels: true,
  token: true,
});
console.log({ az });
const gh = await host.resolveLanguageModelProvider("github", {
  listModels: false,
  token: true,
});
console.log({ gh });
const ghc = await host.resolveLanguageModelProvider("github_copilot_chat", {
  listModels: true,
  token: true,
});
console.log({ ghc });
const oai = await host.resolveLanguageModelProvider("openai", {
  listModels: true,
  token: true,
});
console.log({ oai });
