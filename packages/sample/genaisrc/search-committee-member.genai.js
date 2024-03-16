script({
    title: "search committe member",
    description: "Given PC members, search for their information and summarize",
    group: "conf review",
    temperature: 0.3,
    maxTokens: 4000,
    model: "gpt-4-32k",
})

const content = env.files[0].content
console.log(content)

const { webPages } = await retreival.webSearch(content)
def("PAGES", webPages)

$`You are an experience computing researcher and 
the program chair for a conference.  You have the name of a PC member
and you've searched for information about that person.  The output
of the search is in PAGES.
Your goal is to create row of a csv file for that PC member with the following columns:
- Name
- Affiliation
- Email
- Organization type (e.g., university, industry, government)
- Seniority level (e.g., junior, mid-level, senior)
- A semi-colon separated list of keywords that describe their expertise
`
