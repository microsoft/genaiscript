script({
    title: "defData demo",
    model: "small",
    tests: {
    },
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

$`
E:
${[{ a: 7, b: 8 },
    { a: 9, b: 10 },]}

Identify the data formats of A,B,C,D,E and return the format results as CSV with key value pairs variable,format.
`