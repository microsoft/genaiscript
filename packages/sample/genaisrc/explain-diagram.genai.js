script({
    title: "explain-diagram",
    description: "Given an image of a diagram, explain what it contains",
    categories: ["image tools"],
    model: "gpt-4-turbo-v",
    maxTokens: 4000,
})

defImages(env.files.filter((f) => f.filename.endsWith(".png")))

const outputName = path.join(path.dirname(env.spec.filename), "explanation.md")

// use $ to output formatted text to the prompt
$`You are a helpful assistant. Your goal is to look at the image provided
and write a description of what it contains. You should infer the context
of the diagram, assume that the reader of your explanation is familiar with 
the key terms related to the diagram, and write a thorough description
of what the diagram is illustrating.  After the description, write
suggestions for how to improve the diagram to make the presentation more
effective.  Write output to the file ${outputName}.`
