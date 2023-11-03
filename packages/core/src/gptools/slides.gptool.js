gptool({
    title: "Generate Slides",
    description: "Generate a slidedeck in markdown using vscode-reveal",
    categories: ["samples"],
    temperature: 0.1,
})

const output = env.file.filename.replace(/\.gpspec\.md$/, ".slides.md")
def(
    "FILE",
    env.links.filter(
        (f) => !f.filename.endsWith(".slides.md")
    )
)
def("SLIDES", env.links.filter(
    (f) => f.filename.endsWith(".slides.md")
), { lineNumbers: true })

$`Generate a slidedeck in markdown format for the content in FILE
in SLIDES file ${output}.

-  Each slide should have a title.
-  Use heading level 3 for slide titles.
-  Keep slides titles extremelly short.
-  Use --- to separate slides.
-  Keep the content on each slide short. Maximum 3 bullet points.
-  Use mermaid syntax if you need to generate state diagrams, class inheritance diagrams, relationships.
-  If the source is code, describe the code and show the code in a separate slide.
-  Keep code snippet short. Maximum 10 lines. Use multiple slides if needed. Ellipse sections with ... if necessary.
`
