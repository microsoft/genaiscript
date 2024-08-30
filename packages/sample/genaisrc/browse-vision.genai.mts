script({
    model: "openai:gpt-4o",
})

const page = await host.browse(
    "https://raw.githubusercontent.com/microsoft/genaiscript/main/packages/sample/src/penguins.csv"
)
const screenshot = await page.screenshot()
defImages(screenshot, { detail: "low" })

$`What do you see?`
