script({
    title: "defData demo",
    model: "gpt-3.5-turbo",
    tests: {},
    system: ["system"]
})

defData("A", [{ a: 1, b: 2 }, { a: 3, b: 4 }])
defData("B", { a: 1, b: 2 }, { format: "yaml" })
defData("C", { a: 1, b: 2 }, { format: "json" })
defData(
    "D",
    [
        { a: 1, b: 2 },
        { a: 4, b: 3 },
    ],
    { format: "csv" }
)

$`Identify the data formats of A,B,C,D and return the format results as CSV with key value pairs variable,format.
`