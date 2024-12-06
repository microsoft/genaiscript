script({
    model: "openai:gpt-4o",
    group: "openai",
    files: "src/greeter.ts",
    tests: {
        files: "src/greeter.ts",
    },
})

def("FILE", env.files[0], { prediction: true })

$`Update FILE with a top level file comment that summarize the content.`
