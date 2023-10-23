gptool({
    title: "Generate Slides",
    description: "Generate a slidedeck in markdown",
    temperature: 0.1,
})

const output = env.file.filename.replace(/\.gpspec\.md$/, ".slides.md")
def(
    "FILE",
    env.links.filter(
        (f) => f.filename.endsWith(".md") && !f.filename.endsWith(".slides.md")
    )
)

$`Generate a slidedeck in markdown format for the content in FILE
in file ${output}.

-  Each slide should have a title.
-  Use heading level 3 for slide titles.
-  Keep slides titles extremelly short.
-  Use --- to separate slides.
-  Keep the content on each slide short. Maximum 3 bullet points.
-  Use mermaid syntax if you need to generate state diagrams.
`
