script({
    title: "extract-data-from-chart",
    description: "Given an image of a chart, extract the data it shows into a CSV table",
    group: "image tools",
    model: "gpt-4-turbo-v",
    maxTokens: 4000,
})

defImages(env.files.filter((f) => f.filename.endsWith(".png")))

const outputName = path.join(path.dirname(env.spec.filename), "chart-data.csv")

// use $ to output formatted text to the prompt
$`You are a helpful assistant. Your goal is to look at the image of a chart provided
and extract the data it is presented in a tabular format. Estimate the data values
to the 2 decimal places and place the result table in a CSV file. Pay attention to the fact that some data values may be missing and that colors are being used to associate bars
in the chart with the legend.
Write output to the file ${outputName}.`
