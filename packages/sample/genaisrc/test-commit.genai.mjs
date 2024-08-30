script({
    model: "openai:gpt-4",
    temperature: 0,
    files: [],
    title: "pull request commit review",
    tools: "fs",
    system: [
        "system",
        "system.files",
        "system.typescript",
        "system.annotations",
    ],
    parameters: {
        commit: {
            type: "string",
            default: "HEAD",
            description: "The commit sha to review.",
        },
    },
})

const commit = env.vars.commit
// diff latest commit
const { stdout: changes } = await host.exec("git", [
    "diff",
    `${commit}^`,
    commit,
    "--",
    "**.ts",
    ":!**/genaiscript.d.ts",
    ":!**/jsconfig.json",
    ":!genaisrc/*",
    ":!.github/*",
    ":!.vscode/*",
    ":!*yarn.lock",
    ":!*THIRD_PARTY_LICENSES.md",
])

if (!changes) cancel("No changes in the latest commit.")

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
    lineNumbers: false,
})

def(
    "TESTS",
    tests
        .split(/\n/g)
        .map((test) => test.split(/,\s*/)[1])
        .map((filename) => filename)
        .join("\n"),
    { language: "txt", lineNumbers: false }
)

$`You are an expert TypeScript software developer and architect.

# Task 1

Review the code changes in GIT_DIFF and summarize the changes. 
Keep it short.

# Task 2

For each test in TESTS, assign a validation score between
    - low: The test is not impacted by the changes in GIT_DIFF.
    - medium: The test may be impacted by the changes in GIT_DIFF.
    - high: The test is most likely impacted by the changes in GIT_DIFF.

Report each test, the score and the reason for the score.

# Task 3

Select the most impacted 8 tests.
- Avoid duplicates.
- If no tests are impacted, select the 8 tests at random.

# Task 4

Report the selected tests as a line-separated list of filenames 
in file "packages/sample/temp/commit-tests.txt".
Remove the .genai.js extension.

    File packages/sample/temp/commit-tests.txt:
    \`\`\`text
    test filename 1
    test filename 2
    ...
    \`\`\`

`

defFileOutput("packages/sample/temp/commit-tests.txt")
