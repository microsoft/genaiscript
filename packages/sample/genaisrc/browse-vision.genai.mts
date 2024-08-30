script({
    model: "openai:gpt-4",
})

// open a webpage with data
const page = await host.browse(
    "https://github.com/microsoft/genaiscript/blob/main/packages/sample/src/penguins.csv"
)
console.log(`page loaded`)
// locate the HTML table with data
const table = page.locator("table[data-testid='csv-table']")

// take a screenshot
const screenshot = await table.screenshot({ type: "jpeg", quality: 40 })
console.log(`screenshot ${screenshot.length / 1e3} kb`)

// extract the table data from the screenshot
const { error, fences } = await runPrompt(
    async (_) => {
        _.defImages(screenshot)
        _.$`Extract the data in the image as a CSV table.`
    },
    { model: "openai:gpt-4o" }
)
if (error) throw error
const csv = fences.find((f) => f.language == "csv")
if (!csv) throw new Error("No CSV table found")

// analyze data
def("DATA", csv.content)
$`What is topic of the dataset in DATA?`
