script({
    title: "generate impact assessment",
    description: "Generate an impact assessment for a given project.",
    group: "RAI tools",
})


const pdfs = env.files.filter((f) => f.filename.endsWith(".pdf"))
// console.log("pdf files: ", pdfs)

const { file, pages } = await parsers.PDF(pdfs[0])

const outputName = "assessment-draft.md"

let S = file.content; // Initialize S as the input string
let result = file.content; // Initialize result as the input string
let conclusionIndex = S.lastIndexOf("Conclusion"); // Find the last index of "conclusion"
let appendixIndex = S.indexOf("Case Studies", Math.max(conclusionIndex)); // Find the first index of "appendix" after the last index of "summary" or "conclusion"
if (appendixIndex !== -1) { // If "appendix" is found
    result = S.slice(0, appendixIndex); // Remove everything after "appendix"
} else {
    result = S;
}
// console.log("ci:", conclusionIndex, "ai:", appendixIndex)
// console.log("result: ", result)

def("PROJECTPDF", result)

def("README", env.files.filter((f) => f.filename.endsWith("README.md")))
def("DIRECTIONS", env.files.filter((f) => f.filename.endsWith("how-to.md")))
def("TEMPLATE", env.files.filter((f) => f.filename.endsWith("template.md")))
def("QUESTIONS", env.files.filter((f) => f.filename.endsWith("questions.md")))

// use $ to output formatted text to the prompt
$`You are a helpful assistant. Your goal is to write a draft impact assessment for the project.
Which is documented in PROJECTPDF.
Use the DIRECTIONS and README for guidance in writing the assessment.  

**Be sure** that the resulting assessment thoroughly answers all the questions in QUESTIONS.

Your answer to each question should be ** at least 2 paragraphs** and have
concrete examples to support your answer.

Write the draft assessment to the file ${outputName}.`
