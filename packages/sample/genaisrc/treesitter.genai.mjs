script({
    files: ["src/fib.cpp", "src/greeter.ts", "src/counting.py"],
})
for (const file of env.files) {
    console.log(file.filename)
    const { captures: tags } = await parsers.code(file, "tags")
    print(tags)

    if (file.filename.endsWith(".cpp")) {
        console.log(`functions c++`)
        const { captures: functions } = await parsers.code(
            file,
            `(function_definition) @function`
        )
        print(functions)
    }
}

function print(captures) {
    console.log(
        captures.map(({ name, node }) => ({
            name,
            type: node.type,
            text: node.text,
            start: node.startIndex,
            end: node.endIndex,
        }))
    )
}
