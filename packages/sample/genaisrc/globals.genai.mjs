script({
    tests: {},
    model: "small",
})

const data = {
    name: "foo",
    items: [1, 2, 3],
}

const json5 = JSON5.parse(JSON5.stringify(data))

if (JSON.stringify(json5) !== JSON.stringify(data)) {
    throw new Error(
        "JSON5.stringify(JSON5.parse(JSON5.stringify(data))) !== data"
    )
}
