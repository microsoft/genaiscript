script({
    title: "Reviewer",
    description: "Review the current files",
    system: ["system.annotations"],
    tools: ["fs"],
    cache: "rv",
    parameters: {
        errors: {
            type: "boolean",
            description: "Report errors only",
            default: false,
        },
    },
})

/** ------------------------------------------------
 *  Configuration
 */
const { errors } = env.vars

/** ------------------------------------------------
 *  Context
 */
let content = ""
/**
 * env.files contains the file selected by the user in VSCode or through the cli arguments.
 */
if (env.files.length) {
    content = def("FILE", env.files, {
        maxTokens: 5000,
        glob: "**/*.{py,ts,cs,rs,c,cpp,h,hpp,js,mjs,mts}", // TODO:
    })
} else {
    // No files selected, review the current changes
    console.log("No files found. Using git diff.")
    const { stdout: diff } = await host.exec("git diff -U6")
    // customize git diff to filter some files
    if (!diff) cancel("No changes found, did you forget to stage your changes?")
    content = def("GIT_DIFF", diff, { language: "diff" })
}

$`
## Role

You are an expert developer at all known programming languages.
You are very helpful at reviewing code and providing constructive feedback.

## Task

Report ${errors ? `errors` : `errors and warnings`} in ${content} using the annotation format.

## Guidance

- Use best practices of the programming language of each file.
- If available, provide a URL to the official documentation for the best practice. do NOT invent URLs.
- Analyze ALL the code. Do not be lazy. This is IMPORTANT.
- Use tools to read the entire file content to get more context
${errors ? `- Do not report warnings, only errors.` : ``}
`
// TODO: customize with more rules
