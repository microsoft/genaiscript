script({
    files: "src/rag/*.md",
    tests: {},
})

defDiff("DIFF", "monkey", "donkey")
defDiff("DIFF", env.files[0], env.files[1])

$`Analyze the content of DIFF`
