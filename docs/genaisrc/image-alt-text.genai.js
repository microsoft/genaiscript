script({
    title: "Image Alt Text generator",
    description: "Generate alt text for images",
    model: "openai:gpt-4o",
    group: "docs",
    maxTokens: 4000,
    temperature: 0,
})

// input
const file = env.files[0]
// context
defImages(file)
// task
$`You are an expert in assistive technology. You will analyze each image 
and generate a description alt text for the image.
- Do not include Alt text in the description.`
// output
defFileOutput(file.filename + ".txt", `Alt text for image ${file.filename}`)
