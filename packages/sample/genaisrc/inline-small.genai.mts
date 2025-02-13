script({
    model: "small",
    tests: {},
    provider: "github"
})
let res = await prompt`write a poem`.options({ model: "small" })
env.output.item(`prompt`)
env.output.fence(res, "json")
if (res.error) throw res.error
res = await runPrompt((_) => _.$`write a poem`, { model: "small" })
env.output.item(`run prompt`)
env.output.fence(res, "json")
if (res.error) throw res.error
