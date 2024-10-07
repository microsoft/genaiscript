script({
    description:
        "Given an image of a receipt, extract a csv of the receipt data",
    group: "vision",
    model: "gpt-4o",
    maxTokens: 4000,
})
defImages(env.files)
const schema = defSchema("EXPENSE", {
    type: "array",
    items: {
        type: "object",
        properties: {
            Date: { type: "string" },
            Location: { type: "string" },
            Total: { type: "number" },
            Tax: { type: "number" },
            Item: { type: "string" },
            ExpenseCategory: { type: "string" },
            Quantity: { type: "number" },
        },
        required: ["Date", "Location", "Total", "Tax", "Item", "Quantity"],
    },
})

const outputName = path.join(path.dirname(env.files[0].filename), "items.csv")

$`You are a helpful assistant that is an expert in filing expense reports.
You have information from a receipt in RECEIPT and you need to put the data
in ${outputName} using the ${schema} schema.`
