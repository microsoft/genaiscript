console.log(`loading cli`)
const api = await import("genaiscript/api")

console.log(api)
{
    const res = await api.run("poem")
    if (res.error) throw new Error(res.error)
    await api.run("summarize", "packages/sample/src/rag/markdown.md")
    await api.run("parameters", [], {
        vars: {
            string: "abc",
            number: 123,
            boolean: true,
            stringSchema: "efg",
            numberSchema: 456,
            booleanSchema: true,
        },
    })
}

process.chdir("..")
{
    await api.run(
        "summarize",
        "genaiscript/packages/sample/src/rag/markdown.md"
    )
}
