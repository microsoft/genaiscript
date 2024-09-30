script({ model: "openai:gpt-3.5-turbo", tests: {} })
const json = await workspace.readJSON("src/sample.json")
if (json.foo !== "bar") throw new Error("Invalid JSON")
const xml = await workspace.readXML("src/sample.xml")
if (xml.foo.bar !== "baz") throw new Error("Invalid xml")

const csv = await workspace.readCSV("src/penguins.csv")
if (!csv.length) throw new Error("Invalid csv")
