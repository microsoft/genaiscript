script({
    files: ["**/*.{mjs,mts}", "**/*.md"],
    flexTokens: 20000,
})

def("SCRIPTS", env.files, { flex: 1 })
$`Summarize FILE.`
