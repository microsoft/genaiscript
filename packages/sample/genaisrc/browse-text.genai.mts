script({
    model: "gpt-3.5-turbo",
    group: "browser",
    tests: {
        keywords: ["bill"],
    },
})
const page = await host.browse(
    "https://github.com/microsoft/genaiscript/blob/main/packages/sample/src/penguins.csv"
)
const table = page.locator('table[data-testid="csv-table"]')
const html = await table.innerHTML()
console.log(`HTML:` + html)
const csv = HTML.convertToMarkdown(html)
console.log(`MD: ` + csv)
def("DATA", csv)
$`Analyze DATA.`
