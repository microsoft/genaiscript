script({
    title: "defData demo",
})

defData("yaml", { a: 1, b: 2 })
defData("json", { a: 1, b: 2 }, { format: "json" })
defData(
    "csv",
    [
        { a: 1, b: 2 },
        { a: 4, b: 3 },
    ],
    { format: "csv" }
)

$`Identify the data formats of yaml, json and csv variables.`