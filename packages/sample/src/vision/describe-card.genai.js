script({
    description: "Given an image of business card, extract the details to a csv file",
    group: "image tools",
    model: "gpt-4-turbo-v",
    maxTokens: 4000,
})
defImages(env.files)

const outputName = path.join(path.dirname(env.files[0].filename), "card.csv")

$`You are a helpful assistant.  You are given an image of a business 
card.  Extract the following information in ${outputName}:

   Name, Address, Phone, Email, Company, Title, Website, Category of Business

If you can't infer the category, mark it as "Unknown"`
