script({
    group: "browser",
})
const page = await host.browse(
    "https://github.com/microsoft/genaiscript/blob/main/packages/sample/src/penguins.csv"
)
const table = page.locator('table[data-testid="csv-table"]')
const csv = HTML.convertToMarkdown(await table.innerHTML())
def("DATA", csv)
$`Analyze DATA.`
