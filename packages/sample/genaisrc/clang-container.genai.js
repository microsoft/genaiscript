script({
    model: "openai:gpt-3.5-turbo",
})
const container = await host.container({
    image: "chainguard/clang",
})
let sourceIndex = 0
defTool(
    "clang",
    "C compiler",
    {
        source: "",
    },
    async (args) => {
        const { source } = args

        const cwd = `tmp/${sourceIndex++}`
        const fn = `main.c`
        await container.writeText(fn, source)
        return await container.exec("clang", [fn], { cwd })
    }
)

$`Generate a valid C program that prints "Hello, World!"`
