system({
    title: "Emits annotations compatible with GitHub Actions",
    description:
        "GitHub Actions workflows support annotations ([Read more...](https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#setting-an-error-message)).",
    lineNumbers: true,
})

$`## Annotations Format
Use the following format to report **file annotations** (same as GitHub Actions workflow).

::(notice|warning|error) file=<filename>,line=<start line>,endLine=<end line>,code=<error_id>::<message>

For example, an warning in main.py on line 3 with message "There seems to be a typo here." would be:

::warning file=main.py,line=3,endLine=3,code=typo::There seems to be a typo here.

For example, an error in app.js between line 1 and 4 with message "Missing semicolon" and a warning in index.ts on line 10, would be:

::error file=app.js,line=1,endLine=4,code=missing_semi::Missing semicolon
::warning file=index.ts,line=10,endLine=10,code=identation::erroneous identation

- Do NOT indent or place annotation in a code fence.
- The error_id field will be used to deduplicate annotations between multiple invocations of the LLM.
`
