script({
    title: "Linters",
    systemSafety: false,
    system: ["system", "system.assistant", "system.annotations"],
    responseType: "markdown",
    tools: [
        "agent_fs",
        "agent_git",
        "agent_github",
        "agent_planner",
        "agent_docs",
        "agent_interpreter",
    ],
    parameters: {
        base: {
            type: "string",
            description: "The base commit to compare against.",
            default: "HEAD^",
        },
    },
})

const { vars, dbg, output } = env
const base = vars.base || (await git.defaultBranch())
const linters = await workspace.findFiles("genaisrc/linters/*.md")
if (!linters) cancel("no linters found in genaisrc/linters/*.md")
dbg(`found %d linters`, linters.length)

const changes = await git.diff({
    base,
    llmify: true,
    ignoreSpaceChange: true,
})
if (!changes) cancel("nothing changed")
const diff = def("DIFF", changes, {
    language: "diff",
    maxTokens: 7000,
    detectPromptInjection: "available",
})
dbg(changes)

$`You are an expert in code linting. 

You will be provided a list of linters and you will apply them
to the code in the ${diff} variable using the strategy below.

## Strategy

for each linter:
   read the linter description
   apply the linter to the code in ${diff}
   report any errors or warnings using annotations format. Use the linter name in the description.

## Linters

`.role("system")
for (const linter of linters) {
    const name = path.changeext(path.basename(linter.filename), "")
    const content = MD.content(linter)

    // scale down each title by 2
    const patched = content.replace(/^(#+)/gm, (m) => `##${m}`)

    $`### Linter: ${name}`.role("system")
    writeText(patched, { role: "system" })
}

$`## Output

Use the full power of GitHub Flavored Markdown to create a glorious response.
`.role("system")
