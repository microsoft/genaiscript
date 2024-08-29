script({
    model: "gpt-3.5-turbo",
    group: "browser",
})
const page = await host.browse(
    "https://github.com/microsoft/genaiscript/blob/main/packages/sample/src/penguins.csv"
)
const table = page.locator('table[data-testid="csv-table"]')
const html = await table.innerHTML()
const csv = HTML.convertTablesToJSON("<table>" + html + "</table>")[0]
csv.forEach((row) => delete row[Object.keys(row)[0]]) // remove the first column
defData("DATA", csv, { format: "csv" })
$`Analyze DATA and provide a statistical summary.`
