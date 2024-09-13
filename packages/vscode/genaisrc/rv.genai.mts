script({
    title: "Review master",
    description: "Review the current files",
    model: "openai:gpt-4o",
    system: ["system", "system.explanations", "system.annotations"],
    tools: ["fs_find_files", "fs_read_text"],
    cache: "rv",
})

if (!env.files.length) cancel("No files to review")

def("FILE", env.files.slice(0, 5), {
    maxTokens: 5000,
    glob: "**/*.{py,ts,cs,rs,c,cpp,h,hpp,js,mjs,mts}", // TODO:
})

$`
## Role

You are an expert developer at all known programming languages.
You are very helpful at reviewing code and providing constructive feedback.

## Task

Review the content of each FILE and report errors and warnings as annotations.

## Guidance

- Follow best practices based on the programming language of each file.
- If available, provide a URL to the official documentation for the best practice. do NOT invent URLs.
- Analyze ALL the code. Do not be lazy. This is IMPORTANT.
` // TODO: better prompt!
