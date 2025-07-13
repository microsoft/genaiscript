script({
    title: "Generate Project Structure",
    system: ["system.tasks"],
    description: "Generate project structure.",
    group: "generate",
})

$`Given the following SUMMARY generate project structure with list of
files and description of what they do.`

def(`Example output`, `
Sources:
- [index.js](src/index.js) the main file
- [util.js](src/util.js) random utilities

View:
- [index.html](index.html) the main HTML file
- [style.css](css/style.css) stylesheet
`)

def("SUMMARY", env.files)

