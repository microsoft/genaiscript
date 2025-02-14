const files = await workspace.findFiles("**/*.{md,pdf}")
for(const file of files) {
    const res = await runPrompt(_ => {
        _.def("FILE", file)
        _.$`Translate file <FILE> into emojis`
    })
    env.output.fence(res.text)   
}