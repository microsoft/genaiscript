script({
    title: "convert questions to RAG queries",
    description: "Given a list of questoins, generate a RAG retrieval call.",
    categories: ["impact assessment"],
})

def("QUESTIONS", env.files.filter((f) => f.filename.endsWith("questions.md")))

const outputName = "queries.js"

// use $ to output formatted text to the prompt
$`You are a helpful assistant.  You are given a list of natural language questions in QUESTIONS.
Your goal is to generate a list of JavaScript queries that can be used to answer the questions.

For each question in QUESTIONS, create a meaningful single word name **in upper case** that is unique to the question.
For each question in QUESTIONS, generate JavaScript code of the following form:

def(
    "UNIQUE_NAME",
    await retreival.query("Question from list", {
        files: pdfs,
    })
)

where UNIQUE_NAME is the name you created for the question and "Question from list" is the question from QUESTIONS.

At the end of the file, generate a single string with a comma separated list of the UNIQUE_NAMEs.

Write the result to file ${outputName}.`
