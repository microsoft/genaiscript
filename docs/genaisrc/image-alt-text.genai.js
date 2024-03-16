script({
    title: "Image Alt Text generator",
    description: "Generate alt text for images",
    model: "gpt-4-turbo-v",
    group: "Sample",
    maxTokens: 4000,
    temperature: 0
})

const file = env.files[0]
defImages(file)

$`You are an expert in assistive technology. You will analyze each image 
and generate a description alt text for the image.

Save the alt text in a file called "${file.filename + ".txt"}".
`