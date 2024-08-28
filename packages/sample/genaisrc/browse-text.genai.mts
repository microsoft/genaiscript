script({
    model: "gpt-3.5-turbo",
    group: "browser",
})
const page = await host.browse(
    "https://github.com/microsoft/genaiscript/blob/main/packages/sample/src/penguins.csv"
)
const table = page.locator('table[data-testid="csv-table"]')
const html = await table.innerHTML()
console.log(`HTML:` + html)
const csv = HTML.convertToText(html)
console.log(`TEXT: ` + csv)
def("DATA", csv)
$`Analyze DATA.`
