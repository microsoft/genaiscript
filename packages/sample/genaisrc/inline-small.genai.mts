script({
    model: "small",
    tests: {},
})
let res = await prompt`write a poem`.options({ model: "small" })
if (res.error) throw res.error
res = await runPrompt((_) => _.$`write a poem`, { model: "small" })
if (res.error) throw res.error
