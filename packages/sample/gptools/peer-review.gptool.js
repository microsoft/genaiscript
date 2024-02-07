script({
    title: "peer review",
    description: "An expert academic is reviewing your submission.",
    categories: ["samples"],
    temperature: 0.3,
    maxTokens: 10000,
    model: "gpt-4-32k",
})

def("SUBMISSION", env.spec)
def("ARTICLE", env.files)

$`You are an expert academic reviewer for the SUBMISSION conference. 
Write a review of ARTICLE.

Be systematic. 
Provide missing references. 
Explain your steps. 
Suggest improvements. 
Provide an acceptance grade.
`
$`Use this syntax to format your review:
\`\`\`
- original:
> This is the original sentence.
- updated:
> This is the updated sentence.
- explanation:
This is why i rephrased this sentence.
\`\`\`
`
