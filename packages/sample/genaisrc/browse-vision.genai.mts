const url =
    env.vars.url ||
    "https://github.com/microsoft/genaiscript/blob/main/packages/sample/src/penguins.csv"

// open a webpage with data
const page = await host.browse(url)
// locate the HTML table with data
const table = page.getByTestId("csv-table")
// take a screenshot
const screenshot = await table.screenshot({
    style: `
    table, th, td, tr {
        border: 1px solid black !important;
        background: white !important;
        color: black !important;
    }
`,
})
console.log(`screenshot ${screenshot.length / 1e3} kb`)

// extract the table data from the screenshot
const { error, fences } = await runPrompt(
    async (_) => {
        _.defImages(screenshot)
        _.$`Extract the text in the request image. Format the output as a CSV table. If you cannot find text in the image, return 'no data'.`
    },
    { model: "large" }
)
if (error) throw error
const csv = fences.find((f) => f.language == "csv")
if (!csv) throw new Error("No CSV table found")

// analyze data
def("DATA", csv.content)
$`What is topic of the dataset in DATA?`
