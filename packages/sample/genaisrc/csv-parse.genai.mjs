script({
    model: "small",
    tests: {},
})

const csv = await workspace.readText("src/penguins.csv")
const rows = CSV.parse(csv)

console.log(rows)
