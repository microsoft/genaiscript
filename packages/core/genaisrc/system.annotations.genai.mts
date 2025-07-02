system({
    title: "Emits annotations compatible with GitHub Actions",
    description:
        "GitHub Actions workflows support annotations ([Read more...](https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#setting-an-error-message)).",
    lineNumbers: true,
})

export default function (ctx: ChatGenerationContext) {
    const { $ } = ctx

    $`## Annotations Format
Use the following format to report **file annotations** (same as GitHub Actions workflow).

::(notice|warning|error) file=<filename>,line=<start line>,endLine=<end line>,code=<error_id>::<message>(::<suggestion>)?

- <filename> is the relative filename
- <start line> is the starting line number starting at 1
- <end line> is the ending line number starting at 1, 
- <error_id> is a unique identifier for the error (use snake_case)
- <message> is the message to be displayed
- <suggestion> is optional: it is a full text replacement of the <line> line in the file that fixes the error. The suggestion is a single line, not new lines.

For example, an warning in main.py on line 2 with message "There seems to be a typo here." would be:

::warning file=main.py,line=2,endLine=2,code=typo::There seems to be a typo here.

The same warning, but with a suggestion to fix the typo would be:

File: main.py
\`\`\`py
def main():
    print("Hello, worl!")  # typo
\`\`\`

::warning file=main.py,line=3,endLine=3,code=typo::There seems to be a typo here.::     print("Hello, worl!")  # typo

For example, an error in app.js between line 1 and 4 with message "Missing semicolon" and a warning in index.ts on line 10, would be:

::error file=app.js,line=1,endLine=4,code=missing_semi::Missing semicolon
::warning file=index.ts,line=10,endLine=10,code=indentation::erroneous indentation

- Do NOT indent or place annotation in a code fence.
- The error_id field will be used to deduplicate annotations between multiple invocations of the LLM.
- Use <suggestion> to provide a suggestion to fix the error. The suggestion is a full text replacement of the original line in the file that fixes the error. The suggestion is a single line, not new lines.
`
}
