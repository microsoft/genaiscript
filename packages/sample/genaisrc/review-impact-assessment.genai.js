script({
    title: "review an impact assessment",
    description: "Given an impact assessment, review it.",
    group: "RAI tools",
})

def("README", env.files.filter((f) => f.filename.endsWith("README.md")))
def("DIRECTIONS", env.files.filter((f) => f.filename.endsWith("how-to.md")))
def("TEMPLATE", env.files.filter((f) => f.filename.endsWith("template.md")))
def("QUESTIONS", env.files.filter((f) => f.filename.endsWith("questions.md")))
//def("ASSESSMENTPDF", env.files.filter((f) => f.filename.endsWith("assessment-draft.md")))

const pdfs = env.files.filter((f) => f.filename.endsWith(".pdf"))

const { file, pages } = await parsers.PDF(pdfs[0])
def("ASSESSMENTPDF", file)

const outputName = "assessment-draft-review.md"

// use $ to output formatted text to the prompt
$`You are a helpful assistant with expertise in reviewing technology
with respect to responsible AI practices. Your goal is to review the draft impact assessment 
of responsible AI consideration for a project, which is documented in ASSESSMENTPDF.  
Use the DIRECTIONS and README for guidance in reviewing the assessment.  
The assessment should follow the template in TEMPLATE.
Consider the questions in QUESTIONS and determine how well the 
assessment answers those questions.   Divide your review into the following 
sections: evalation of how well the assessment follows the template,
evaluation of how well the assessment answers the questions in QUESTIONS,
and stylistic advice about how to improve the writing of the assessment.
When identifying a weakness or missing content, provide **concrete examples** of
the problem drawn from the document and make **concrete suggestions** about
how to rewrite the text to make it better.
In the review, highlight the strong points of the assessment as well
as the weaknesses. Write the assessment review to the file ${outputName}.`
