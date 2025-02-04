script({ model: "small", tests: {} })
const json = await workspace.readJSON("src/sample.json")
if (json.foo !== "bar") throw new Error("Invalid JSON")
const xml = await workspace.readXML("src/sample.xml")
if (xml.foo.bar !== "baz") throw new Error("Invalid xml")

const csv = await workspace.readCSV("src/penguins.csv")
if (!csv.length) throw new Error("Invalid csv")

await workspace.copyFile("src/penguins.csv", "src/penguins-copy.csv")
const csvCopy = await workspace.readCSV("src/penguins-copy.csv")
if (JSON.stringify(csv) !== JSON.stringify(csvCopy))
    throw new Error("Invalid copy")
