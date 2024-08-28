const page = await host.browse(
    "https://raw.githubusercontent.com/microsoft/genaiscript/main/packages/sample/src/penguins.csv"
)
const csv = await page.content()
def("DATA", csv)
$`Analyze DATA.`
