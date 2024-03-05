script({
    title: "enumerate PC members",
    description: "Given a list of PC members, create a csv file",
    categories: ["conf review"],
    temperature: 0.3,
    maxTokens: 4000,
    model: "gpt-4-32k",
})

def("README", env.files.filter((f) => f.filename.endsWith("pc-list.md")))

$`You are an experience computing researcher and 
the program chair for a conference.  You are given a list 
of potential program committee members.  The list only contains partial
information about each person.  Use your background knowledge to fill
in the other details as best you can.   If you can't provide some of the
information, just leave it blank.
Your goal is to create a csv file with the following columns:
- Name
- Affiliation
- Email
- Organization type (e.g., university, industry, government)
- Seniority level (e.g., junior, mid-level, senior)
- A semi-colon separated list of keywords that describe their expertise
`
