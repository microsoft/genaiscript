script({
    description:
        "Given an image of a receipt, extract a csv of the receipt data",
    group: "vision",
    model: "gpt-4-turbo-v",
    maxTokens: 4000,
})
defImages(env.files)
const outputName = path.join(path.dirname(env.files[0].filename), "items.csv")

$`You are a helpful assistant that is an expert in filing expense reports.
You have information from a receipt in RECEIPT and you need to put the data
in a CSV file ${outputName} with the following columns:

    Date, Location, Total, Tax, Item, Expense Category, Quantity

If you can't infer the category, mark it as "Unknown`
