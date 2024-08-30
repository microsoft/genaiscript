script({
    model: "openai:gpt-4",
})

const page = await host.browse(
    "https://raw.githubusercontent.com/microsoft/genaiscript/main/packages/sample/src/penguins.csv"
)

const { fences } = await runPrompt(
    async (_) => {
        const screenshot = await page.screenshot()
        _.defImages(screenshot, { detail: "low" })

        _.$`Extract the data in the image as a CSV table.`
    },
    { model: "openai:gpt-4o" }
)

def("DATA", fences.find((f) => f.language == "csv").content)
$`What is topic of the dataset in DATA?`
