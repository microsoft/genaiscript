script({
    model: "small",
})
const container = await host.container({
    image: "gcc",
})
let sourceIndex = 0
defTool(
    "gcc",
    "GNU Compiler Collection (GCC), C/C++ compiler",
    {
        source: "",
    },
    async (args) => {
        const { source } = args

        const fn = `tmp/${sourceIndex++}/main.c`
        await container.writeText(fn, source)
        const res = await container.exec("gcc", [fn])
        return res
    }
)

$`Generate a valid C program that prints "Hello, World!"`
