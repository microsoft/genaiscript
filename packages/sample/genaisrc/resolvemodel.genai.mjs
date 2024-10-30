const large = await host.resolveLanguageModel("large")
console.log({ large })
const small = await host.resolveLanguageModel("small")
console.log({ small })
const d = await host.resolveLanguageModel()
console.log({ default: d })
const { model } = env.meta
const dm = await host.resolveLanguageModel(model)
console.log({ current: dm })
