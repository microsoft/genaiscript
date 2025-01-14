script({
    files: "src/penguins.csv",
    tests: {},
    model: "small",
})

def("DATA", env.files, { sliceSample: 3 })
def("DATA", env.files, { sliceHead: 3 })
def("DATA", env.files, { sliceTail: 3 })

const csv = env.files[0].content
const rows = CSV.parse(csv)
const prows = parsers.CSV(csv)
if (JSON.stringify(rows) !== JSON.stringify(prows))
    throw new Error("csv error 1")

const srows = CSV.parse(
    `A|1
    B|2
    C|3`,
    { delimiter: "|", headers: ["name", "value"] }
)
env.output.table(srows)
if (
    JSON.stringify(srows) ===
    JSON.stringify([
        { name: "A", value: 1 },
        { name: "B", value: 2 },
    ])
)
    throw new Error("csv error 3")

$`Describe the data in DATA.`
