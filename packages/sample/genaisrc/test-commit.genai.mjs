script({
    model: "openai:gpt-4",
    temperature: 0,
    files: [],
    title: "pull request commit review",
    system: [
        "system",
        "system.files",
        "system.typescript",
        "system.annotations",
    ],
})

// diff latest commit
const { stdout: changes } = await host.exec("git", [
    "diff",
    "HEAD^",
    "HEAD",
    "--",
    "**.ts",
])

// list of tests
const { stdout: tests } = await host.exec("node", [
    "packages/cli/built/genaiscript.cjs",
    "test",
    "list",
    "--groups",
    ":!vision",
])

def("GIT_DIFF", changes, {
    language: "diff",
    maxTokens: 20000,
    ignoreEmpty: true,
})
def(
    "TESTS",
    tests
        .split(/\n/g)
        .map((test) => test.split(/,\s*/)[1])
        .map((filename) => ({ filename })),
    { language: "txt", maxTokens: 20000 }
)

$`You are an expert TypeScript software developer and architect.

# Task 1

Review the code changes in GIT_DIFF and summarize the changes. Keep it short.

# Task 2

For each test in TESTS, assign a validation score between
    - low: The test is not impacted by the changes in GIT_DIFF.
    - medium: The test may be impacted by the changes in GIT_DIFF.
    - high: The test is most likely impacted by the changes in GIT_DIFF.

Report each test, the score and the reason for the score.

# Task 3

Select the most impacted 8 tests.
Avoid duplicates.

# Task 4

Report the selected tests as a line-separated list of filenames 
in file "temp/commit-tests.txt".
Remove the .genai.js extension.

    File temp/commit-tests.txt:
    \`\`\`text
    test filename 1
    test filename 2
    ...
    \`\`\`

`

defFileOutput("temp/commit-tests.txt")
