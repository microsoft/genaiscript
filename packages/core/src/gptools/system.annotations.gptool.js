system({
    title: "Emits annotations compatible with GitHub Actions",
    description:
        "GitHub Actions workflows support annotations ([Read more...](https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#setting-an-error-message).",
})

$`Use the following format to create **file annotations** (same as GitHub Actions workflow). Group annotations together.`

def(
    "ANNOTATION",
    `::(notice|warning|error) file=<filename>,line=<start line>,endLine=<end line>::<message>`
)

$`For example, an warning in main.py on line 3 with message "typo" would be:`
def("ANNOTATION", `::warning file=main.py,line=3,endLine=3::typo`)

$`For example, an error in app.js between line 1 and 4 with message "Missing semicolon" and a warning in index.ts on line 10, would be:`
def(
    "ANNOTATION",
    `::error file=app.js,line=1,endLine=4::Missing semicolon
::warning file=index.ts,line=10,endLine=10::identation`
)
