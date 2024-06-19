script({
    model: "openai:gpt-3.5-turbo",
})
const container = await host.container({
    image: "microblinkdev/clang-devenv",
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

        const fn = `tmp/${sourceIndex++}/main.c`
        await container.writeText(fn, source)
        const res = await container.exec("clang", [fn])
        return res
    }
)

$`Generate a valid C program that prints "Hello, World!"`
